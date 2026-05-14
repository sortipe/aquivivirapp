
import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { User } from '@/types';

// URL de tu proyecto de Supabase. Ya está configurada.
const supabaseUrl = 'https://lfflgrzbtazzaiyfgafz.supabase.co'; 

// Clave pública anónima de tu proyecto de Supabase.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmZmxncnpidGF6emFpeWZnYWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTg5NDksImV4cCI6MjA3MzM3NDk0OX0.E6RJDgTgButrL-aXXeoLYq7q-l1cgnZxZGd-_N5q3_k';

// FIX: Explicitly configured Supabase client auth options to ensure session persistence and automatic token refreshing. This is a robust way to prevent "Invalid Refresh Token" errors, which occur when the client cannot find the session data in local storage to refresh an expired access token.
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

/**
 * Fetches the user profile from the public 'users' table.
 * Assumes you have a table named 'users' with RLS policies set up.
 * The 'id' in your 'users' table should be a foreign key to 'auth.users.id'.
 */
export const getProfileForUser = async (user: any): Promise<User | null> => {
    if (!user) return null;

    const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
        console.error('Error fetching user profile:', JSON.stringify(error, null, 2));
        throw error;
    }
    
    if (!profile) {
        // This is a critical configuration error. An authenticated user MUST have a profile
        // or RLS policies must allow them to read it.
        throw new Error("User profile not found. This is likely due to restrictive Row Level Security (RLS) policies on the 'users' table.");
    }


    return profile;
};

const definitiveRLSFixForUsersTable = `-- SOLUCIÓN DEFINITIVA PARA PERMISOS DE LA TABLA "users" --

-- PASO 1: CREAR UNA FUNCIÓN SEGURA PARA OBTENER EL ROL DEL USUARIO ACTUAL
-- Esta función se ejecuta con permisos elevados (SECURITY DEFINER) para evitar la recursión.
-- Lee de forma segura el rol del usuario que está realizando la consulta.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- PASO 2: HABILITAR LA SEGURIDAD A NIVEL DE FILA (RLS) EN LA TABLA DE USUARIOS
-- Si ya está habilitada, este comando no hará nada. Es seguro ejecutarlo.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- PASO 3: ELIMINAR CUALQUIER POLÍTICA ANTIGUA PARA EVITAR CONFLICTOS
-- Esto limpia la configuración para asegurar que solo apliquen las nuevas reglas correctas.
DROP POLICY IF EXISTS "Permitir a los usuarios ver su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Permitir a los administradores gestionar todos los perfiles" ON public.users;
DROP POLICY IF EXISTS "Permitir a los usuarios ver perfiles" ON public.users;
DROP POLICY IF EXISTS "Permitir a los administradores crear perfiles" ON public.users;
DROP POLICY IF EXISTS "Permitir a los administradores actualizar perfiles" ON public.users;
DROP POLICY IF EXISTS "Permitir a los administradores eliminar perfiles" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users; -- Common policy from Supabase starters

-- PASO 4: CREAR LAS NUEVAS POLÍTICAS DE SEGURIDAD USANDO LA FUNCIÓN

-- Política de LECTURA (SELECT):
-- Esta es la política más importante. Permite dos cosas:
-- 1. Que cualquier usuario autenticado pueda leer SU PROPIA información de perfil.
-- 2. Que un usuario con el rol 'admin' (verificado con la función 'get_my_role()') pueda leer los perfiles de TODOS los usuarios.
CREATE POLICY "Permitir a los usuarios ver perfiles" ON public.users
FOR SELECT
USING (
  (auth.uid() = id) OR (public.get_my_role() = 'admin')
);

-- Política de CREACIÓN (INSERT): Solo los administradores pueden crear nuevos usuarios.
CREATE POLICY "Permitir a los administradores crear perfiles" ON public.users
FOR INSERT
WITH CHECK (public.get_my_role() = 'admin');

-- Política de ACTUALIZACIÓN (UPDATE): Solo los administradores pueden actualizar la información de los usuarios.
CREATE POLICY "Permitir a los administradores actualizar perfiles" ON public.users
FOR UPDATE
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

-- Política de ELIMINACIÓN (DELETE): Solo los administradores pueden eliminar usuarios.
CREATE POLICY "Permitir a los administradores eliminar perfiles" ON public.users
FOR DELETE
USING (public.get_my_role() = 'admin');

--- FIN DEL SCRIPT ---
`;

export const formatSupabaseError = (error: any): string => {
    // 1. Handle non-objects first
    if (!error) return "Unknown error";
    if (typeof error !== 'object') {
        return String(error);
    }

    // 2. Handle standard JS Errors (Network Error, etc.)
    if (error instanceof Error) {
        return error.message;
    }

    // 3. It's an object. Let's get the message.
    const message = String(error.message || error.error_description || error.msg || '');

    // 4. Run specific handlers for critical issues.
    
    // DETECT MISSING COLUMNS FOR TASKS
    if (message.includes("Could not find the") && message.includes("column")) {
        if (message.includes("'customAddress'") || message.includes("'tasks'")) {
            const updateTasksSQL = `
-- ACTUALIZACIÓN DE ESQUEMA PARA TAREAS (TASKS) --

-- 1. Permitir tareas sin propiedad vinculada (hacer propertyId opcional)
ALTER TABLE public.tasks ALTER COLUMN "propertyId" DROP NOT NULL;

-- 2. Añadir columnas para ubicación manual
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "customAddress" TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
`;
            return `Error de Esquema de Base de Datos: Faltan columnas en la tabla 'tasks'.\n\nLa aplicación ha sido actualizada para soportar tareas con ubicación manual, pero la base de datos necesita una actualización.\n\n**Solución:**\nCopie y pegue el siguiente código en el "SQL Editor" de Supabase y ejecútelo para añadir las columnas faltantes:\n\n${updateTasksSQL}`;
        }

        // NEW: Detect missing 'workerIds' array column
        if (message.includes("'workerIds'")) {
            const multiWorkerSQL = `
-- ACTUALIZACIÓN DE ESQUEMA PARA ASIGNACIÓN MÚLTIPLE --

-- 1. Crear columna para múltiples IDs
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS "workerIds" TEXT[];

-- 2. Migrar datos existentes
UPDATE public.tasks 
SET "workerIds" = ARRAY["workerId"] 
WHERE "workerIds" IS NULL AND "workerId" IS NOT NULL;

-- 3. Hacer opcional la columna antigua
ALTER TABLE public.tasks ALTER COLUMN "workerId" DROP NOT NULL;
`;
            return `Error de Esquema: Falta columna 'workerIds'.\n\nPara asignar múltiples trabajadores, necesitas actualizar la base de datos.\n\n**Solución:**\nEjecuta este SQL en Supabase:\n\n${multiWorkerSQL}`;
        }

        // DETECT MISSING IMAGES COLUMN FOR DAILY LOGS
        if (message.includes("'images'") && message.includes("'daily_logs'")) {
            const updateDailyLogsSQL = `
-- ACTUALIZACIÓN DE ESQUEMA PARA BITÁCORA (DAILY_LOGS) --

-- Añadir columna para múltiples imágenes (array de texto)
ALTER TABLE public.daily_logs ADD COLUMN IF NOT EXISTS images TEXT[];
`;
            return `Error de Esquema de Base de Datos: Falta columna 'images' en la tabla 'daily_logs'.\n\nLa aplicación ha sido actualizada para soportar múltiples fotos en la bitácora, pero la base de datos necesita una actualización.\n\n**Solución:**\nCopie y pegue el siguiente código en el "SQL Editor" de Supabase y ejecútelo:\n\n${updateDailyLogsSQL}`;
        }
    }

    // DETECT MISSING COLUMN FOR VISITS CHECK-IN
    if (message.includes("Could not find the") && message.includes("'check_in_time'") && message.includes("'visits'")) {
        const updateVisitsSQL = `
-- ACTUALIZACIÓN DE ESQUEMA PARA VISITAS (VISITS) --

-- Añadir columna para registrar la hora exacta de llegada (Check-in)
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
`;
        return `Error de Esquema de Base de Datos: Falta columna 'check_in_time' en la tabla 'visits'.\n\nLa aplicación necesita esta columna para el registro de llegada.\n\n**Solución:**\nCopie y pegue el siguiente código en el "SQL Editor" de Supabase y ejecútelo:\n\n${updateVisitsSQL}`;
    }

    if (message.includes("Could not find the table") && message.includes("in the schema cache")) {
        const match = message.match(/table 'public\.([^']+)'/);
        const tableName = match ? match[1] : 'desconocida';

        let createTableSQL = '';

        if (tableName === 'formats') {
            createTableSQL = `
-- SCRIPT PARA CREAR LA TABLA 'formats' --

-- PASO 1: Crear la tabla para almacenar los formatos.
CREATE TABLE public.formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- PASO 2: Habilitar la Seguridad a Nivel de Fila (RLS) para proteger los datos.
ALTER TABLE public.formats ENABLE ROW LEVEL SECURITY;

-- PASO 3: Crear políticas de seguridad para la tabla 'formats'.
-- Política de LECTURA: Todos los usuarios autenticados pueden ver los formatos.
CREATE POLICY "Permitir lectura a todos los usuarios autenticados"
ON public.formats
FOR SELECT
USING (auth.role() = 'authenticated');

-- Política de CREACIÓN/ACTUALIZACIÓN/ELIMINACIÓN: Solo los administradores pueden gestionar los formatos.
CREATE POLICY "Permitir a los administradores gestionar formatos"
ON public.formats
FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- FIN DEL SCRIPT --
`;
        }

        if (tableName === 'daily_logs') {
            createTableSQL = `
-- SCRIPT PARA CREAR LA TABLA 'daily_logs' --

-- PASO 1: Crear la tabla para almacenar la bitácora diaria.
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  log_time TIME NOT NULL,
  description TEXT NOT NULL,
  images TEXT[] -- Array de URLs de imágenes
);

-- PASO 2: Habilitar la Seguridad a Nivel de Fila (RLS) para proteger los datos.
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- PASO 3: Crear políticas de seguridad para la tabla 'daily_logs'.
-- Política de LECTURA: Los trabajadores pueden ver sus propias entradas, los administradores ven todo.
CREATE POLICY "Permitir a usuarios ver su propia bitácora y a admins ver todo"
ON public.daily_logs
FOR SELECT
USING (
  (auth.uid() = user_id) OR
  ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
);

-- Política de CREACIÓN: Los usuarios pueden crear sus propias entradas.
CREATE POLICY "Permitir a los usuarios crear sus propias entradas de bitácora"
ON public.daily_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política de ELIMINACIÓN: Solo los administradores pueden eliminar entradas.
CREATE POLICY "Permitir a los administradores eliminar entradas de bitácora"
ON public.daily_logs
FOR DELETE
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- FIN DEL SCRIPT --
`;
        } 
        
        if (createTableSQL) {
            return `Error de Base de Datos: La tabla "${tableName}" no existe.\n\nEste es un error crítico que impide que la aplicación funcione correctamente. La tabla necesaria para esta sección no se encuentra en su base de datos Supabase.\n\n**Solución:**\nCopie y pegue TODO el siguiente código en el "SQL Editor" de su panel de Supabase y ejecútelo para crear la tabla y sus permisos de seguridad.\n\n${createTableSQL}\n\nDespués de ejecutar el script, recargue la aplicación.`;
        }
    }
    
    if ((message.includes("User profile not found") && message.includes("RLS")) || (message.includes("infinite recursion detected") && message.includes('relation "users"'))) {
        const title = message.includes("infinite recursion") 
            ? "Error de Recursión Infinita en Permisos" 
            : "Error Crítico de Permisos de Perfil";
            
        const explanation = message.includes("infinite recursion")
            ? `Este es un error crítico de permisos (RLS) en la tabla de usuarios. Ocurre porque una política de seguridad para administradores intenta leer la misma tabla 'users' para verificar el rol, creando un bucle infinito.`
            : `Este es un error crítico de permisos (RLS) en la tabla de usuarios. Ocurre porque la política de seguridad no permite que un usuario recién autenticado lea su propio perfil de la tabla 'users'. Sin este permiso, la aplicación no puede cargar sus datos.`;

        const howToFix = `**Solución Definitiva:**
La siguiente configuración de políticas para la tabla 'users' está diseñada para solucionar este problema de forma robusta y segura. Copie y pegue TODO el siguiente código en el "SQL Editor" de su panel de Supabase y ejecútelo.

${definitiveRLSFixForUsersTable}

Una vez ejecutado este script, el error de perfil de usuario debería desaparecer y podrá iniciar sesión correctamente.`;

        return `${title}\n\n${explanation}\n\n${howToFix}`;
    }
    
    if (message.includes("violates row-level security policy")) {
        const match = message.match(/for relation "([^"]+)"/);
        const tableName = match ? match[1] : null;

        let howToFix = `Este es un error de permisos en la base de datos (Row Level Security - RLS). Puede deberse a permisos faltantes en una tabla de la base de datos o en el almacenamiento de archivos (Storage).

**Solución:**
Copie y pegue TODO el siguiente código en el "SQL Editor" de su panel de Supabase y ejecútelo. Esto configurará los permisos necesarios tanto para las tablas como para la subida de archivos.
`;

        if (tableName) {
            howToFix += `

--- INICIO: PERMISOS PARA TABLA "${tableName}" ---

-- PASO 1: Habilitar RLS en la tabla (si no está activado)
ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Permitir lectura a todos los usuarios" ON public.${tableName};
DROP POLICY IF EXISTS "Permitir a los administradores crear" ON public.${tableName};
DROP POLICY IF EXISTS "Permitir a los usuarios actualizar" ON public.${tableName};
DROP POLICY IF EXISTS "Permitir a los administradores actualizar" ON public.${tableName};
DROP POLICY IF EXISTS "Permitir a los administradores eliminar" ON public.${tableName};

-- PASO 3: Crear nuevas políticas de seguridad para la tabla
-- Política de LECTURA: Todos los usuarios autenticados pueden ver.
CREATE POLICY "Permitir lectura a todos los usuarios"
ON public.${tableName}
FOR SELECT
USING (auth.role() = 'authenticated');

-- Política de CREACIÓN: Solo los administradores pueden crear.
CREATE POLICY "Permitir a los administradores crear"
ON public.${tableName}
FOR INSERT
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Política de ACTUALIZACIÓN: Cualquier usuario autenticado puede actualizar.
-- Esto es necesario para que los trabajadores puedan marcar recursos como vistos.
-- La lógica de la app previene que hagan otras modificaciones no deseadas.
CREATE POLICY "Permitir a los usuarios actualizar"
ON public.${tableName}
FOR UPDATE
USING (auth.role() = 'authenticated');

-- Política de ELIMINACIÓN: Solo los administradores pueden eliminar.
CREATE POLICY "Permitir a los administradores eliminar"
ON public.${tableName}
FOR DELETE
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

--- FIN: PERMISOS PARA TABLA "${tableName}" ---
`;
        }

        howToFix += `

--- INICIO: PERMISOS PARA SUBIDA DE ARCHIVOS (STORAGE) ---

-- Estas políticas permiten a los usuarios subir y ver archivos en las carpetas (buckets)
-- de la aplicación. Los administradores tendrán control total para modificar y eliminar.

-- Eliminar políticas de Storage antiguas para evitar conflictos
DROP POLICY IF EXISTS "Permitir a todos ver los assets" ON storage.objects;
DROP POLICY IF EXISTS "Permitir a admins gestionar assets" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver archivos de Captaciones" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir archivos de Captaciones" ON storage.objects;
DROP POLICY IF EXISTS "Permitir a admins gestionar Captaciones" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver archivos de Propiedades" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir archivos de Propiedades" ON storage.objects;
DROP POLICY IF EXISTS "Permitir a admins gestionar Propiedades" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver archivos de Capacitación" ON storage.objects;
DROP POLICY IF EXISTS "Permitir a admins gestionar Capacitación" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver fotos de Visitas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir fotos de Visitas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir a admins gestionar Visitas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver archivos de Descargas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir archivos de Descargas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir a admins gestionar Descargas" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver archivos de Formatos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir a admins gestionar Formatos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver archivos de Bitacora" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subir archivos de Bitacora" ON storage.objects;
DROP POLICY IF EXISTS "Permitir a admins gestionar Bitacora" ON storage.objects;


-- Bucket: app-assets (Logo de la app)
CREATE POLICY "Permitir a todos ver los assets" ON storage.objects FOR SELECT USING (bucket_id = 'app-assets');
CREATE POLICY "Permitir a admins gestionar assets" ON storage.objects FOR ALL USING (bucket_id = 'app-assets' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin') WITH CHECK (bucket_id = 'app-assets' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Bucket: captacion-files
CREATE POLICY "Permitir ver archivos de Captaciones" ON storage.objects FOR SELECT USING (bucket_id = 'captacion-files' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir subir archivos de Captaciones" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'captacion-files' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir a admins gestionar Captaciones" ON storage.objects FOR ALL USING (bucket_id = 'captacion-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin') WITH CHECK (bucket_id = 'captacion-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Bucket: property-files
CREATE POLICY "Permitir ver archivos de Propiedades" ON storage.objects FOR SELECT USING (bucket_id = 'property-files' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir subir archivos de Propiedades" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-files' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir a admins gestionar Propiedades" ON storage.objects FOR ALL USING (bucket_id = 'property-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin') WITH CHECK (bucket_id = 'property-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Bucket: training-files (Capacitación)
CREATE POLICY "Permitir ver archivos de Capacitación" ON storage.objects FOR SELECT USING (bucket_id = 'training-files' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir a admins gestionar Capacitación" ON storage.objects FOR ALL USING (bucket_id = 'training-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin') WITH CHECK (bucket_id = 'training-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Bucket: visit-photos
CREATE POLICY "Permitir ver fotos de Visitas" ON storage.objects FOR SELECT USING (bucket_id = 'visit-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir subir fotos de Visitas" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'visit-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir a admins gestionar Visitas" ON storage.objects FOR ALL USING (bucket_id = 'visit-photos' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin') WITH CHECK (bucket_id = 'visit-photos' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Bucket: temp-downloads
CREATE POLICY "Permitir ver archivos de Descargas" ON storage.objects FOR SELECT USING (bucket_id = 'temp-downloads' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir subir archivos de Descargas" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'temp-downloads' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir a admins gestionar Descargas" ON storage.objects FOR ALL USING (bucket_id = 'temp-downloads' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin') WITH CHECK (bucket_id = 'temp-downloads' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Bucket: format-files
CREATE POLICY "Permitir ver archivos de Formatos" ON storage.objects FOR SELECT USING (bucket_id = 'format-files' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir a admins gestionar Formatos" ON storage.objects FOR ALL USING (bucket_id = 'format-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin') WITH CHECK (bucket_id = 'format-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- Bucket: binnacle-files
CREATE POLICY "Permitir ver archivos de Bitacora" ON storage.objects FOR SELECT USING (bucket_id = 'binnacle-files' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir subir archivos de Bitacora" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'binnacle-files' AND auth.role() = 'authenticated');
CREATE POLICY "Permitir a admins gestionar Bitacora" ON storage.objects FOR ALL USING (bucket_id = 'binnacle-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin') WITH CHECK (bucket_id = 'binnacle-files' AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');


--- FIN: PERMISOS PARA STORAGE ---
`;
        const finalContext = tableName ? `la tabla "${tableName}"` : "el almacenamiento de archivos";
        return `Error de Permisos (RLS) en ${finalContext}\n\n${howToFix}`;
    }

    if (message.includes("Could not find the") && message.includes("column")) {
        return `Error de Base de Datos: Una columna que la aplicación necesita no existe.\n\n${message}\n\nSolución: Verifique que la tabla en Supabase coincide con la estructura de la aplicación. Es posible que necesite añadir la columna faltante usando el SQL Editor.`;
    }

    if (message.includes('Bucket not found')) {
        const requiredBuckets = ['app-assets', 'captacion-files', 'format-files', 'property-files', 'temp-downloads', 'training-files', 'visit-photos', 'binnacle-files'];
        const howToFix = `¡ATENCIÓN! Este error NO se soluciona con código. Es un paso de configuración MANUAL y OBLIGATORIO que usted debe realizar en la página web de Supabase.

La aplicación no puede crear estas carpetas por usted por motivos de seguridad. Por favor, siga estas instrucciones una sola vez:

Solución:
1. Vaya al panel de control de su proyecto Supabase.
2. En el menú de la izquierda, haga clic en el icono de 'Storage'.
3. Cree los siguientes 'buckets' si no existen. ¡Los nombres deben coincidir EXACTAMENTE!
   - ${requiredBuckets.join('\n   - ')}

Instrucciones para crear cada bucket:
- Haga clic en el botón 'New bucket'.
- Ingrese el nombre del bucket (p. ej., 'property-files').
- MUY IMPORTANTE: Active la opción 'Public bucket'. Esto es necesario para que la aplicación pueda mostrar las imágenes y documentos.
- Haga clic en 'Create bucket'.
- Repita el proceso para todos los buckets de la lista.

Una vez que todos los buckets públicos estén creados, recargue la aplicación y el error desaparecerá.`;
        return `Error al subir el archivo: ${message}\n\n${howToFix}`;
    }
    
    // 5. Final fallback for objects (e.g. Supabase errors or custom objects)
    if (Object.prototype.hasOwnProperty.call(error, 'message') || Object.prototype.hasOwnProperty.call(error, 'details')) {
        const parts = [];
        
        // Helper function to safely format any value into a string, preventing "[object Object]".
        const formatValue = (value: any): string => {
            if (typeof value === 'string') return value;
            if (value === null || value === undefined) return 'N/A';
            try {
                // For objects/arrays, pretty-print the JSON.
                return JSON.stringify(value, null, 2);
            } catch {
                // If stringify fails (e.g., circular reference), return a safe fallback string.
                return '[Unserializable Object]';
            }
        };

        if (Object.prototype.hasOwnProperty.call(error, 'message')) {
            parts.push(`Message: ${formatValue(error.message)}`);
        }
        if (Object.prototype.hasOwnProperty.call(error, 'details')) {
            parts.push(`Details: ${formatValue(error.details)}`);
        }
        if (Object.prototype.hasOwnProperty.call(error, 'hint')) {
            parts.push(`Hint: ${formatValue(error.hint)}`);
        }
        if (Object.prototype.hasOwnProperty.call(error, 'code')) {
            parts.push(`Code: ${formatValue(error.code)}`);
        }

        if (parts.length > 0) {
            return parts.join('\n');
        }
    }

    // 6. Final fallback for anything else
    try {
        const str = JSON.stringify(error, null, 2);
        if (str !== '{}') {
            return str;
        }
    } catch {
        // Fall through
    }
    
    // If standard error object was passed but no message property was own-property, we still want the message
    if (error.message) return error.message;

    return "An unknown error occurred. Check the developer console for more details.";
};
