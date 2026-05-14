
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase, getProfileForUser, formatSupabaseError } from '@/supabaseClient';
import { Session, RealtimeChannel } from '@supabase/supabase-js';

// Import Components
import Login from '@/components/Login';
import Header from '@/components/Header';
import Dashboard from '@/components/Dashboard';
import PropertyList from '@/components/PropertyList';
import PropertyDetails from '@/components/PropertyDetails';
import ManageUsers from '@/components/ManageUsers';
import TrainingCenter from '@/components/TrainingCenter';
import Calendar from '@/components/Calendar';
import CaptacionesList from '@/components/CaptacionesList';
import CaptacionDetails from '@/components/CaptacionDetails';
import CaptacionForm from '@/components/CaptacionForm';
import NotificationPanel from '@/components/NotificationPanel';
import Reports from '@/components/Reports';
import Settings from '@/components/Settings';
import Formatos from '@/components/Formatos';
import AddFormatForm from '@/components/AddFormatForm';
import NetworkErrorOverlay from '@/components/NetworkErrorOverlay';
import PropertyForm from '@/components/PropertyForm';
import BinnacleView from '@/components/BinnacleView';
import WhatsAppNotificationModal from '@/components/WhatsAppNotificationModal';


// Import Modals
import AddVisitModal from '@/components/AddVisitModal';
import EditVisitModal from '@/components/EditVisitModal';
import VisitDetailsModal from '@/components/VisitDetailsModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import AddTaskModal from '@/components/AddTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import AddEventModal from '@/components/AddEventModal';
import EditEventModal from '@/components/EditEventModal';
import CalendarActionModal from '@/components/CalendarActionModal';
import CalendarItemDetailsModal from '@/components/CalendarItemDetailsModal';
import ScheduleVisitModal from '@/components/ScheduleVisitModal';
import FileUploadWarningModal from '@/components/FileUploadWarningModal';


// Import Types & Icons
import { User, UserRole, TaskStatus, Notification, Property, Task, DailyLog, CaptacionStatus } from '@/types';
import { ChartPieIcon } from '@/components/icons/ChartPieIcon';
import { BuildingOfficeIcon } from '@/components/icons/BuildingOfficeIcon';
import { UsersIcon } from '@/components/icons/UsersIcon';
import { AcademicCapIcon } from '@/components/icons/AcademicCapIcon';
import { ClipboardDocumentCheckIcon } from '@/components/icons/ClipboardDocumentCheckIcon';
import { CalendarDaysIcon } from '@/components/icons/CalendarDaysIcon';
import { CogIcon } from '@/components/icons/CogIcon';
import { DocumentTextIcon } from '@/components/icons/DocumentTextIcon';
import { ClipboardDocumentListIcon } from "@/components/icons/ClipboardDocumentListIcon";


const NavItem = ({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) => (
  _jsx("li", {
    children: _jsxs("button", {
      onClick: onClick,
      className: `flex items-center w-full p-3 rounded-lg text-left transition-colors ${isActive
          ? 'bg-orange-500 text-white shadow'
          : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
        }`,
      children: [
        _jsx("span", { className: "h-6 w-6", children: icon }),
        _jsx("span", { className: "ml-3 font-medium", children: label })
      ]
    })
  })
);

const Sidebar = ({ activeView, onNavigate, currentUser, isSidebarOpen }: { activeView: string, onNavigate: (view: string) => void, currentUser: User, isSidebarOpen: boolean }) => {
  const isCurrentUserAdmin = currentUser.role === UserRole.ADMIN;

  const navItems = [
    { view: 'dashboard', label: 'Dashboard', icon: _jsx(ChartPieIcon, {}), adminOnly: false },
    { view: 'properties', label: 'Propiedades', icon: _jsx(BuildingOfficeIcon, {}), adminOnly: false },
    { view: 'calendar', label: 'Calendario', icon: _jsx(CalendarDaysIcon, {}), adminOnly: false },
    { view: 'captaciones', label: 'Captaciones', icon: _jsx(ClipboardDocumentCheckIcon, {}), adminOnly: false },
    { view: 'binnacle', label: 'Bitácora', icon: _jsx(ClipboardDocumentListIcon, {}), adminOnly: false },
    { view: 'reports', label: 'Reportes', icon: _jsx(ChartPieIcon, {}), adminOnly: true },
    { view: 'manage-users', label: 'Usuarios', icon: _jsx(UsersIcon, {}), adminOnly: true },
    { view: 'training', label: 'Capacitaciones', icon: _jsx(AcademicCapIcon, {}), adminOnly: false },
    { view: 'formatos', label: 'Formatos', icon: _jsx(DocumentTextIcon, {}), adminOnly: false },
    { view: 'settings', label: 'Ajustes', icon: _jsx(CogIcon, {}), adminOnly: true },
  ];

  const availableNavItems = navItems.filter(item => !item.adminOnly || isCurrentUserAdmin);

  return (
    _jsx("aside", {
      className: `fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40 transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-64 flex-shrink-0`,
      children: _jsxs("div", {
        className: "p-4",
        children: [
          _jsx("h2", { className: "text-2xl font-bold text-orange-500 mb-8", children: "AquivivirApp" }),
          _jsx("ul", {
            className: "space-y-2",
            children: availableNavItems.map(item =>
              _jsx(NavItem, {
                icon: item.icon,
                label: item.label,
                isActive: activeView === item.view,
                onClick: () => onNavigate(item.view)
              }, item.view)
            )
          })
        ]
      })
    })
  );
};

// Helper for retrying Supabase fetch operations.
const fetchWithRetry = async (
  fetcher: () => Promise<{ data: any; error: any }>, 
  retries = 3, 
  delay = 1000
) => {
  let lastError: any = null;
  for (let i = 0; i < retries; i++) {
    const result = await fetcher();
    if (!result.error) {
      return result; // Success
    }
    lastError = result.error;

    // Only retry on generic network errors.
    const errorMessage = (lastError && typeof lastError.message === 'string') ? lastError.message : '';
    if (errorMessage.includes('Failed to fetch')) {
       console.warn(`Attempt ${i + 1} failed. Retrying in ${delay * (i + 1)}ms...`);
       await new Promise(res => setTimeout(res, delay * (i + 1))); // Linear backoff
    } else {
      break; // Don't retry on specific database/auth errors.
    }
  }
  return { data: null, error: lastError };
};


const App = () => {
  // State variables
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [trainingResources, setTrainingResources] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [captaciones, setCaptaciones] = useState<any[]>([]);
  const [formats, setFormats] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [appSettings, setAppSettings] = useState<{ [key: string]: string }>({});

  // UI states
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedCaptacionId, setSelectedCaptacionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [modalState, setModalState] = useState<{ type: string | null; data?: any }>({ type: null, data: null });
  const [isFileUploadWarningOpen, setIsFileUploadWarningOpen] = useState(false);
  const [whatsAppModal, setWhatsAppModal] = useState({
    isOpen: false,
    recipientName: '',
    phone: '',
    message: '',
    associatedPhone: ''
  });

  // Real-time channel reference
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastUserIdRef = useRef<string | null>(null);
  const isModalOpenRef = useRef(false);
  const dataIsStaleRef = useRef(false);

  useEffect(() => {
    isModalOpenRef.current = modalState.type !== null;
  }, [modalState]);


  const broadcastDbChange = () => {
    if (channelRef.current && currentUser) {
        channelRef.current.send({
            type: 'broadcast',
            event: 'db-change',
            payload: { senderId: currentUser.id },
        });
    }
  };

  const fetchPublicData = useCallback(async () => {
    try {
        const { data, error } = await supabase.from('app_settings').select('*');
        if (error) throw error;
        if (data) {
            const settingsObject = data.reduce((acc, setting) => {
                if (setting && setting.key) {
                    acc[setting.key] = setting.value;
                }
                return acc;
            }, {});
            setAppSettings(settingsObject);
        }
    } catch (error: any) {
        // Improved error logging
        console.error("Error fetching public settings:", error.message || JSON.stringify(error, null, 2));
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      console.log('Fetching all data...');
      const dataSources = [
        { name: 'users', setter: setUsers },
        { name: 'properties', setter: setProperties },
        { name: 'visits', setter: setVisits },
        { name: 'tasks', setter: setTasks },
        { name: 'notifications', setter: setNotifications },
        { name: 'training_resources', setter: setTrainingResources },
        { name: 'calendar_events', setter: setCalendarEvents },
        { name: 'captaciones', setter: setCaptaciones },
        { name: 'formats', setter: setFormats },
        { name: 'daily_logs', setter: setDailyLogs },
      ];

      const promises = dataSources.map(source =>
        fetchWithRetry(async () => supabase.from(source.name).select('*'))
      );

      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        if (result.error) throw result.error;
        const dataToSet = result.data || [];
        if (dataSources[index].name === 'notifications') {
          const typedData = dataToSet.map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
          (dataSources[index].setter as Function)(typedData);
        } else {
            (dataSources[index].setter as Function)(dataToSet);
        }
      });
      setInitialLoadError(null);
    } catch (error: any) {
      console.error("Data fetching error:", error);
      const errorMessage = (error && typeof error.message === 'string') ? error.message : '';
      if (errorMessage.includes('Failed to fetch')) {
        const helpMessage = `Connection Error: Failed to connect to the database.\n\nPlease follow these steps:\n1. Go to your Supabase project dashboard.\n2. Navigate to Project Settings > API.\n3. Under 'Configuration', find 'Cross-Origin Resource Sharing (CORS)'.\n4. Add the URL of this application to the list of allowed origins. You can use '*' for local development, but be specific for production.\n\nDetailed Error: ${errorMessage}`;
        setInitialLoadError(helpMessage);
      } else {
        setInitialLoadError(formatSupabaseError(error));
      }
    }
  }, []);

  useEffect(() => {
      const handleFileUploadWarning = () => {
          setIsFileUploadWarningOpen(true);
      };
      document.addEventListener('open-file-upload-warning', handleFileUploadWarning);
      return () => {
          document.removeEventListener('open-file-upload-warning', handleFileUploadWarning);
      };
  }, []);

  useEffect(() => {
    fetchPublicData();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setLoading(false);
      }
    });
  
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );
  
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchPublicData]);
  
  useEffect(() => {
    if (!session) {
      setCurrentUser(null);
      setLoading(false);
      lastUserIdRef.current = null;
      return;
    }

    const currentUserId = session.user.id;
    if (lastUserIdRef.current === currentUserId) {
      return;
    }
  
    const loadUserAndData = async () => {
      setLoading(true);
      try {
        const profile = await getProfileForUser(session.user);
        setCurrentUser(profile);
        await fetchData();
        lastUserIdRef.current = currentUserId;
      } catch (error: any) {
        // Improved error logging
        console.error("Error loading user data:", error.message || JSON.stringify(error, null, 2));
        setInitialLoadError(formatSupabaseError(error as any));
        lastUserIdRef.current = null;
        await supabase.auth.signOut();
      } finally {
        setLoading(false);
      }
    };
  
    loadUserAndData();
  
  }, [session, fetchData]);

  useEffect(() => {
    if (!session || !currentUser) {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        return;
    }

    if (!channelRef.current) {
        const channel = supabase.channel('app-updates');
        
        const handleDbChange = ({ payload }: { payload: { senderId?: string } }) => {
            if (payload?.senderId && payload.senderId === currentUser.id) {
                return;
            }

            if (isModalOpenRef.current) {
                dataIsStaleRef.current = true;
                return;
            }

            fetchData();
            fetchPublicData();
        };

        channel
            .on('broadcast', { event: 'db-change' }, handleDbChange)
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    channelRef.current = channel;
                } else if (status === 'CLOSED') {
                    if (channelRef.current === channel) {
                       channelRef.current = null;
                    }
                } else if (status === 'CHANNEL_ERROR') {
                    supabase.removeChannel(channel).finally(() => {
                        if (channelRef.current === channel) {
                            channelRef.current = null;
                        }
                    });
                }
            });
    }

    return () => {
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    };
  }, [session, currentUser, fetchData, fetchPublicData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleNavigate = (view: string) => {
    setActiveView(view);
    setSelectedPropertyId(null);
    setSelectedCaptacionId(null);
    setIsSidebarOpen(false);
  };

  const handleNavigateToProperty = (propertyId: string) => {
    handleCloseModal();
    setSelectedPropertyId(propertyId);
  };

  const selectedProperty = useMemo(() => properties.find(p => p.id === selectedPropertyId), [properties, selectedPropertyId]);
  const visitsForSelectedProperty = useMemo(() => visits.filter(v => v.propertyId === selectedPropertyId), [visits, selectedPropertyId]);
  
  // Updated to check multiple workers
  const tasksForSelectedProperty = useMemo(() => tasks.filter(t => t.propertyId === selectedPropertyId), [tasks, selectedPropertyId]);
  
  const selectedCaptacion = useMemo(() => captaciones.find(c => c.id === selectedCaptacionId), [captaciones, selectedCaptacionId]);
  const unreadNotificationsCount = useMemo(() => notifications.filter(n => (n.recipientId === currentUser?.id || n.recipientId.startsWith('all-')) && !(n.readBy || []).includes(currentUser?.id ?? '')).length, [notifications, currentUser]);
  const workers = useMemo(() => users.filter(u => u.role === UserRole.WORKER), [users]);

  const handleOpenModal = (type: string, data: any = null) => setModalState({ type, data });
  const handleCloseModal = useCallback(() => {
    setModalState({ type: null, data: null });
    if (dataIsStaleRef.current) {
        fetchData();
        fetchPublicData();
        dataIsStaleRef.current = false;
    }
  }, [fetchData, fetchPublicData]);

  // --- WHATSAPP NOTIFICATION LOGIC ---
  const handleWhatsAppNotification = (workerId: string, message: string, clientPhone: string = '') => {
      const worker = users.find(u => u.id === workerId);
      if (worker && worker.phone) {
          setWhatsAppModal({
              isOpen: true,
              recipientName: worker.name,
              phone: worker.phone,
              message: message,
              associatedPhone: clientPhone
          });
      }
  };

  // Handlers for manually resending notifications from details views
  const handleResendVisitNotification = (visit: any, workerId: string, propertyId: string) => {
      const worker = users.find(u => u.id === workerId);
      const property = properties.find(p => p.id === propertyId);
      
      if (worker && worker.phone) {
          // Using standard unicode emojis for better compatibility
          const message = `🏠 *Recordatorio de Visita*\n\nHola ${worker.name.split(' ')[0]},\ntienes una visita programada:\n\n👤 Cliente: ${visit.clientName} ${visit.clientPhone ? `(${visit.clientPhone})` : ''}\n📍 Propiedad: ${property?.name || 'N/A'}\n📅 Fecha: ${visit.date}\n⏰ Hora: ${visit.time}\n\nPor favor, revisa la App.`;
          
          setWhatsAppModal({
              isOpen: true,
              recipientName: worker.name,
              phone: worker.phone,
              message: message,
              associatedPhone: visit.clientPhone || ''
          });
      }
  };

  const handleResendTaskNotification = (task: Task) => {
      // Handle multiple workers if present, or fallback to single workerId
      const targetId = task.workerId; 
      
      const worker = users.find(u => u.id === targetId);
      if (worker && worker.phone) {
          const message = `📅 *Recordatorio de Tarea*\n\nHola ${worker.name.split(' ')[0]},\ntienes una tarea pendiente:\n\n📝 *${task.description}*\n📅 Para: ${task.dueDate} ${task.time || ''}\n\nPor favor, revisa la App.`;
          
          setWhatsAppModal({
              isOpen: true,
              recipientName: worker.name,
              phone: worker.phone,
              message: message,
              associatedPhone: ''
          });
      }
  };

  // CRUD Handlers
  const handleAddOrUpdate = async (tableName: string, data: any, id: string | null = null, shouldClose: boolean = true) => {
    const { error } = id
      ? await supabase.from(tableName).update(data).eq('id', id)
      : await supabase.from(tableName).insert(data);
    
    if (error) {
        alert(formatSupabaseError(error));
    } else {
        if (id && data.workerId) {
            if (tableName === 'visits') {
                const { error: taskError } = await supabase.from('tasks').update({ workerId: data.workerId }).eq('visit_id', id);
                if (taskError) console.error("Error syncing task worker:", taskError);
            } else if (tableName === 'tasks') {
                if (data.visit_id) {
                     const { error: visitError } = await supabase.from('visits').update({ workerId: data.workerId }).eq('id', data.visit_id);
                     if (visitError) console.error("Error syncing visit worker:", visitError);
                }
            }
        }

        // --- WHATSAPP NOTIFICATION FOR TASKS ---
        if (tableName === 'tasks' && !id && data.description) {
            // Handle multiple workers notification
            const targetWorkerIds = data.workerIds || (data.workerId ? [data.workerId] : []);
            
            // Only show WhatsApp modal if current user is admin
            if (currentUser?.role === UserRole.ADMIN) {
                // We can only show one modal at a time. We'll notify for the first valid worker found.
                // In a real app, we might want to queue these or show a list.
                for (const wid of targetWorkerIds) {
                    if (wid === currentUser.id) continue;
                    
                    const worker = users.find(u => u.id === wid);
                    if (worker && worker.phone) {
                        const message = `📅 *Nueva Tarea Asignada*\n\nHola ${worker.name.split(' ')[0]},\nse te ha asignado una nueva tarea:\n\n📝 *${data.description}*\n📅 Para: ${data.dueDate} ${data.time || ''}\n\nPor favor, revisa la App.`;
                        handleWhatsAppNotification(worker.id, message);
                        break; // Only notify one for now to avoid spamming modals
                    }
                }
            }
        }

        if (shouldClose) {
            handleCloseModal();
        }
        await fetchData();
        broadcastDbChange();
    }
    return !error;
  };

  const handleScheduleVisit = async (visitData: any) => {
      // 1. Insert visit
      const { data: newVisit, error: visitError } = await supabase.from('visits').insert(visitData).select('id').single();
      if (visitError || !newVisit) {
          alert(formatSupabaseError(visitError));
          return false;
      }
  
      // 2. Create and insert task
      const property = properties.find(p => p.id === visitData.propertyId);
      const taskDescription = `Completar reporte de visita para "${visitData.clientName}" en la propiedad "${property?.name || 'N/A'}"`;
      
      const taskData = {
          propertyId: visitData.propertyId,
          workerId: visitData.workerId,
          workerIds: [visitData.workerId], // Ensure consistency
          description: taskDescription,
          dueDate: visitData.date,
          time: visitData.time,
          status: TaskStatus.PENDING,
          created_by: currentUser!.id,
          visit_id: newVisit.id, 
      };
      const { error: taskError } = await supabase.from('tasks').insert(taskData);
      if (taskError) {
          alert(`Se agendó la visita, pero falló la creación de la tarea de seguimiento. Por favor, cree la tarea manualmente.\n\nError: ${formatSupabaseError(taskError)}`);
      }

      handleCloseModal();
      await fetchData();
      broadcastDbChange();

      // --- WHATSAPP NOTIFICATION FOR VISIT (Triggered after fetch/broadcast) ---
      if (visitData.workerId && visitData.workerId !== currentUser?.id && currentUser?.role === UserRole.ADMIN) {
          const worker = users.find(u => u.id === visitData.workerId);
          if (worker) {
              const message = `🏠 *Nueva Visita Agendada*\n\nHola ${worker.name.split(' ')[0]},\nse ha programado una visita:\n\n👤 Cliente: ${visitData.clientName} ${visitData.clientPhone ? `(${visitData.clientPhone})` : ''}\n📍 Propiedad: ${property?.name || 'N/A'}\n📅 Fecha: ${visitData.date}\n⏰ Hora: ${visitData.time}\n\nPor favor, revisa la App.`;
              handleWhatsAppNotification(worker.id, message, visitData.clientPhone);
          }
      }

      return true;
  };

    const handleUpdateVisitAndCompleteTask = async (visitData: any, taskId: string, shouldClose: boolean = true) => {
        const { error: visitError } = await supabase.from('visits').update(visitData).eq('id', visitData.id);
        if (visitError) {
            alert(formatSupabaseError(visitError));
            return false;
        }

        if (shouldClose) {
            const taskUpdateData: any = { status: TaskStatus.COMPLETED };
            if (visitData.workerId) {
                taskUpdateData.workerId = visitData.workerId;
            }

            const { error: taskError } = await supabase.from('tasks').update(taskUpdateData).eq('id', taskId);
            if (taskError) {
                alert(`La visita se actualizó, pero falló al completar la tarea. Por favor, complétela manualmente.\n\nError: ${formatSupabaseError(taskError)}`);
            }
            handleCloseModal();
        }
        
        await fetchData();
        broadcastDbChange();
        return true;
    };

    const handleOpenVisitEditorForTask = (visitId: string, taskId: string) => {
        const visitToEdit = visits.find(v => v.id === visitId);
        if (visitToEdit) {
            handleOpenModal('edit-visit-from-task', { visit: visitToEdit, taskId: taskId });
        } else {
            alert('No se encontró la visita asociada a esta tarea.');
        }
    };


  const handleUpdateSetting = async (key: string, value: string) => {
    const { error } = await supabase.from('app_settings').upsert({ key, value });
    if (error) alert(formatSupabaseError(error));
    else {
        await fetchPublicData();
        broadcastDbChange();
    }
    return !error;
};
  
  const handleDelete = async (tableName: string, id: string) => {
      if (tableName === 'visits') {
        const { error: taskError } = await supabase
          .from('tasks')
          .delete()
          .eq('visit_id', id);
        
        if (taskError) {
          console.error(`Could not delete associated task for visit ${id}:`, taskError);
        }
      }

      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) {
        alert(formatSupabaseError(error));
      } else {
        handleCloseModal();
        await fetchData();
        broadcastDbChange();
    }
  };

  const handleAddDailyLog = async ({ description, files }: { description: string, files: File[] }) => {
    if (!currentUser || !description.trim()) return false;

    try {
        let imageUrls: string[] = [];
        
        if (files && files.length > 0) {
            for (const file of files) {
                // Generate a completely new, safe filename ignoring the original filename
                const fileExt = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
                const safeFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `binnacle-files/${currentUser.id}/${safeFileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('binnacle-files')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('binnacle-files')
                    .getPublicUrl(filePath);
                
                imageUrls.push(urlData.publicUrl);
            }
        }

        const now = new Date();
        const logData = {
            user_id: currentUser.id,
            log_date: now.toISOString().split('T')[0],
            log_time: now.toTimeString().split(' ')[0].substring(0, 8),
            description: description,
            images: imageUrls,
            image_url: imageUrls[0] || null, // Backward compatibility
        };

        const { error } = await supabase.from('daily_logs').insert(logData);

        if (error) {
            alert(formatSupabaseError(error));
            return false;
        } else {
            await fetchData();
            broadcastDbChange();
            return true;
        }
    } catch (error) {
        alert(formatSupabaseError(error));
        return false;
    }
};

  const handleDeleteDailyLog = async (logId: string) => {
      const { error } = await supabase.from('daily_logs').delete().eq('id', logId);
      if (error) {
          alert(formatSupabaseError(error));
      } else {
          await fetchData();
          broadcastDbChange();
      }
  };

  const handleMarkTaskComplete = async (taskId: string) => {
    await handleAddOrUpdate('tasks', { status: TaskStatus.COMPLETED }, taskId);
  };

  const handleMarkNotificationAsRead = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && currentUser) {
        const updatedReadBy = [...(notification.readBy || []), currentUser.id];
        await handleAddOrUpdate('notifications', { readBy: updatedReadBy }, notificationId);
    }
  };

  const handleMarkResourceAsViewed = async (resourceId: string) => {
      const resource = trainingResources.find(r => r.id === resourceId);
      if (resource && currentUser && !(resource.viewedBy || []).includes(currentUser.id)) {
          const updatedViewedBy = [...(resource.viewedBy || []), currentUser.id];
          await handleAddOrUpdate('training_resources', { viewedBy: updatedViewedBy }, resourceId);
      }
  };
  

  const renderActiveView = () => {
    if (selectedProperty) {
      return _jsx(PropertyDetails, {
        property: selectedProperty,
        visits: visitsForSelectedProperty,
        tasks: tasksForSelectedProperty,
        users: users,
        currentUser: currentUser!,
        onBack: () => setSelectedPropertyId(null),
        onSelectVisit: (id) => handleOpenModal('visit-details', visits.find(v => v.id === id)),
        onOpenAddVisitModalForProperty: (propId) => handleOpenModal('add-visit', { propertyId: propId }),
        onCompleteTask: handleMarkTaskComplete,
        onOpenVisitEditor: handleOpenVisitEditorForTask,
      });
    }
    if (activeView === 'captaciones' && selectedCaptacionId) {
      return _jsx(CaptacionDetails, {
        captacion: selectedCaptacion,
        currentUser: currentUser!,
        onBack: () => setSelectedCaptacionId(null),
        onEdit: (data) => handleOpenModal('edit-captacion', data),
        onDelete: (id) => handleOpenModal('delete-captacion', captaciones.find(c => c.id === id)),
      });
    }

    switch (activeView) {
      case 'properties':
        return _jsx(PropertyList, { 
            properties: properties, 
            currentUser: currentUser!,
            users: users,
            onSelectProperty: setSelectedPropertyId, 
            onAddProperty: () => handleOpenModal('add-property'), 
            onEditProperty: (property) => handleOpenModal('edit-property', property), 
            onDeleteProperty: (property) => handleOpenModal('delete-property', property) 
        });
      case 'manage-users':
          return _jsx(ManageUsers, { users, currentUser: currentUser!, onAddUser: (data) => handleAddOrUpdate('users', data), onUpdateUser: (data) => handleAddOrUpdate('users', data, data.id), onDeleteUser: (id) => handleOpenModal('delete-user', users.find(u => u.id === id)) });
      case 'calendar':
        return _jsx(Calendar, { currentUser: currentUser!, visits, calendarEvents, tasks, properties, users, onSelectVisit: (id) => handleOpenModal('visit-details', visits.find(v => v.id === id)), onOpenCalendarActionModal: (date) => handleOpenModal('calendar-action', { date }), onSelectItem: (item) => handleOpenModal('calendar-item-details', item) });
      case 'training':
        return _jsx(TrainingCenter, { currentUser: currentUser!, resources: trainingResources, users, onAddResource: (data) => handleAddOrUpdate('training_resources', {...data, viewedBy: []}), onUpdateResource: (data) => handleAddOrUpdate('training_resources', data, data.id), onDeleteResource: (id) => handleDelete('training_resources', id), onMarkAsViewed: handleMarkResourceAsViewed });
      case 'formatos':
        return _jsx(Formatos, { currentUser: currentUser!, formats: formats, onAddFormat: () => handleOpenModal('add-format'), onEditFormat: (format) => handleOpenModal('edit-format', format), onDeleteFormat: (format) => handleOpenModal('delete-format', format) });
      case 'captaciones':
        return _jsx(CaptacionesList, { captaciones, onSelectCaptacion: setSelectedCaptacionId, onAddCaptacion: () => handleOpenModal('add-captacion') });
      case 'reports':
        return _jsx(Reports, { properties, visits, users: users });
      case 'settings':
        return _jsx(Settings, { currentSettings: appSettings, onUpdateSetting: handleUpdateSetting });
      case 'binnacle':
        return _jsx(BinnacleView, { dailyLogs: dailyLogs, users: users, onDeleteLog: handleDeleteDailyLog, currentUser: currentUser!, onAddDailyLog: handleAddDailyLog });
      case 'dashboard':
      default:
        return _jsx(Dashboard, { currentUser: currentUser!, properties, visits, users, tasks, dailyLogs: dailyLogs, onAddDailyLog: handleAddDailyLog, onGoToTaskProperty: (id) => { setActiveView('properties'); setSelectedPropertyId(id); }, onSelectVisit: (id) => handleOpenModal('visit-details', visits.find(v => v.id === id)), onOpenAddVisitModal: () => handleOpenModal('add-visit'), onCompleteTask: handleMarkTaskComplete, onOpenVisitEditor: handleOpenVisitEditorForTask });
    }
  };

  if (loading) {
    return _jsx("div", { className: "h-screen w-screen flex items-center justify-center bg-slate-100", children: "Cargando..." });
  }
  if (initialLoadError) {
    return _jsx(NetworkErrorOverlay, { message: initialLoadError });
  }
  if (!session || !currentUser) {
    return _jsx(Login, { logoUrl: appSettings.app_logo_url });
  }

  return (
    _jsxs(_Fragment, {
      children: [
        _jsxs("div", { className: "min-h-screen flex bg-slate-100", children: [
          _jsx(Sidebar, { activeView: activeView, onNavigate: handleNavigate, currentUser: currentUser, isSidebarOpen: isSidebarOpen }),
          _jsxs("div", { className: "flex-1 flex flex-col", children: [
            _jsx(Header, { currentUser: currentUser, onLogout: handleLogout, unreadCount: unreadNotificationsCount, onToggleNotifications: () => setIsNotificationsOpen(!isNotificationsOpen), onToggleSidebar: () => setIsSidebarOpen(!isSidebarOpen) }),
            _jsx("main", { className: "flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto", children: renderActiveView() })
          ] })
        ] }),
        isNotificationsOpen && _jsx(NotificationPanel, { notifications: notifications, currentUser: currentUser, onClose: () => setIsNotificationsOpen(false), onMarkAsRead: handleMarkNotificationAsRead }),
        
        _jsx(FileUploadWarningModal, { isOpen: isFileUploadWarningOpen, onClose: () => setIsFileUploadWarningOpen(false) }),
        
        _jsx(WhatsAppNotificationModal, {
            isOpen: whatsAppModal.isOpen,
            onClose: () => setWhatsAppModal(prev => ({ ...prev, isOpen: false })),
            recipientName: whatsAppModal.recipientName,
            phone: whatsAppModal.phone,
            message: whatsAppModal.message,
            associatedPhone: whatsAppModal.associatedPhone
        }),

        // Modals
        modalState.type === 'add-property' && _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start p-4 overflow-y-auto", children: _jsx("div", { className: "w-full max-w-4xl my-8", children: _jsx(PropertyForm, { onSubmit: (data) => handleAddOrUpdate('properties', {...data, created_by: currentUser.id}), onCancel: handleCloseModal, workers: workers }) }) }),
        modalState.type === 'edit-property' && _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-start p-4 overflow-y-auto", children: _jsx("div", { className: "w-full max-w-4xl my-8", children: _jsx(PropertyForm, { initialData: modalState.data, onSubmit: (data) => handleAddOrUpdate('properties', data, data.id), onCancel: handleCloseModal, workers: workers }) }) }),
        modalState.type === 'add-visit' && _jsx(AddVisitModal, { isOpen: true, onClose: handleCloseModal, onAddVisit: (data) => handleAddOrUpdate('visits', data), properties, workers: users.filter(u => u.role === UserRole.WORKER), initialDate: modalState.data?.date, initialPropertyId: modalState.data?.propertyId, currentUser }),
        modalState.type === 'edit-visit' && _jsx(EditVisitModal, { isOpen: true, onClose: handleCloseModal, onUpdateVisit: (data, shouldClose) => handleAddOrUpdate('visits', data, data.id, shouldClose), visit: modalState.data, properties, workers: users.filter(u => u.role === UserRole.WORKER), currentUser: currentUser }),
        modalState.type === 'edit-visit-from-task' && _jsx(EditVisitModal, { isOpen: true, onClose: handleCloseModal, onUpdateVisit: (data, shouldClose) => handleUpdateVisitAndCompleteTask(data, modalState.data.taskId, shouldClose), visit: modalState.data.visit, properties: properties, workers: users.filter(u => u.role === UserRole.WORKER), currentUser: currentUser }),
        modalState.type === 'visit-details' && _jsx(VisitDetailsModal, { isOpen: true, onClose: handleCloseModal, visit: modalState.data, property: properties.find(p => p.id === modalState.data.propertyId), worker: users.find(u => u.id === modalState.data.workerId), currentUser: currentUser, onEdit: (data) => { handleCloseModal(); handleOpenModal('edit-visit', data); }, onDelete: (data) => { handleCloseModal(); handleOpenModal('delete-visit', data); }, onNavigateToProperty: handleNavigateToProperty, onResendWhatsApp: handleResendVisitNotification }),
        modalState.type === 'calendar-action' && _jsx(CalendarActionModal, { isOpen: true, onClose: handleCloseModal, onSelectAction: (action) => { handleCloseModal(); handleOpenModal(action === 'event' ? 'event-add' : action, modalState.data); } }),
        modalState.type === 'schedule-visit' && _jsx(ScheduleVisitModal, { isOpen: true, onClose: handleCloseModal, onScheduleVisit: handleScheduleVisit, properties: properties, workers: workers, initialDate: modalState.data?.date }),
        modalState.type === 'task-add' && _jsx(AddTaskModal, { isOpen: true, onClose: handleCloseModal, onAddTask: (data) => handleAddOrUpdate('tasks', {...data, status: TaskStatus.PENDING, created_by: currentUser.id}), properties, workers: users.filter(u => u.role === UserRole.WORKER), initialDate: modalState.data?.date.toISOString().split('T')[0] }),
        modalState.type === 'event-add' && _jsx(AddEventModal, { isOpen: true, onClose: handleCloseModal, onAddEvent: (data) => handleAddOrUpdate('calendar_events', {...data, created_by: currentUser.id}), initialDate: modalState.data?.date.toISOString().split('T')[0] }),
        modalState.type === 'calendar-item-details' && _jsx(CalendarItemDetailsModal, { isOpen: true, item: modalState.data, users, properties, currentUser, onClose: handleCloseModal, onEdit: (item) => { handleCloseModal(); handleOpenModal('workerId' in item || 'workerIds' in item ? 'task-edit' : 'event-edit', item) }, onDelete: (item) => { handleCloseModal(); handleOpenModal('workerId' in item || 'workerIds' in item ? 'task-delete' : 'event-delete', item) }, onNavigateToProperty: handleNavigateToProperty, onResendWhatsApp: handleResendTaskNotification }),
        modalState.type === 'task-edit' && _jsx(EditTaskModal, { isOpen: true, onClose: handleCloseModal, onUpdateTask: (data) => handleAddOrUpdate('tasks', data, data.id), task: modalState.data, properties, workers: users.filter(u => u.role === UserRole.WORKER) }),
        modalState.type === 'event-edit' && _jsx(EditEventModal, { isOpen: true, onClose: handleCloseModal, onUpdateEvent: (data) => handleAddOrUpdate('calendar_events', data, data.id), event: modalState.data }),
        modalState.type === 'add-captacion' && _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4", children: _jsx("div", { className: "w-full max-w-5xl", children: _jsx(CaptacionForm, { onSubmit: (data) => handleAddOrUpdate('captaciones', {...data, created_by: currentUser.id, status: CaptacionStatus.DRAFT }), onCancel: handleCloseModal, currentUser: currentUser! }) }) }),
        modalState.type === 'edit-captacion' && _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4", children: _jsx("div", { className: "w-full max-w-5xl", children: _jsx(CaptacionForm, { initialData: modalState.data, onSubmit: (data) => handleAddOrUpdate('captaciones', data, data.id), onCancel: handleCloseModal, currentUser: currentUser! }) }) }),
        modalState.type === 'add-format' && _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4", children: _jsx(AddFormatForm, { onSubmit: (data) => handleAddOrUpdate('formats', { ...data, created_by: currentUser.id }), onCancel: handleCloseModal }) }),
        modalState.type === 'edit-format' && _jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4", children: _jsx(AddFormatForm, { initialData: modalState.data, onSubmit: (data) => handleAddOrUpdate('formats', data, data.id), onCancel: handleCloseModal }) }),
        
        // Confirmation Modals for Deletion
        modalState.type === 'delete-property' && _jsx(ConfirmationModal, { title: "Eliminar Propiedad", message: `¿Seguro que quieres eliminar "${modalState.data.name}"?`, onConfirm: () => handleDelete('properties', modalState.data.id), onCancel: handleCloseModal }),
        modalState.type === 'delete-user' && _jsx(ConfirmationModal, { title: "Eliminar Usuario", message: `¿Seguro que quieres eliminar a "${modalState.data.name}"?`, onConfirm: () => handleDelete('users', modalState.data.id), onCancel: handleCloseModal }),
        modalState.type === 'delete-visit' && _jsx(ConfirmationModal, { title: "Eliminar Visita", message: `¿Seguro que quieres eliminar la visita de "${modalState.data.clientName}"?`, onConfirm: () => handleDelete('visits', modalState.data.id), onCancel: handleCloseModal }),
        modalState.type === 'task-delete' && _jsx(ConfirmationModal, { title: "Eliminar Tarea", message: `¿Seguro que quieres eliminar esta tarea?`, onConfirm: () => handleDelete('tasks', modalState.data.id), onCancel: handleCloseModal }),
        modalState.type === 'event-delete' && _jsx(ConfirmationModal, { title: "Eliminar Evento", message: `¿Seguro que quieres eliminar este evento?`, onConfirm: () => handleDelete('calendar_events', modalState.data.id), onCancel: handleCloseModal }),
        modalState.type === 'delete-captacion' && modalState.data && _jsx(ConfirmationModal, { title: "Eliminar Captación", message: `¿Seguro que quieres eliminar "${modalState.data.title}"?`, onConfirm: () => handleDelete('captaciones', modalState.data.id), onCancel: handleCloseModal }),
        modalState.type === 'delete-format' && _jsx(ConfirmationModal, { title: "Eliminar Formato", message: `¿Seguro que quieres eliminar "${modalState.data.title}"?`, onConfirm: () => handleDelete('formats', modalState.data.id), onCancel: handleCloseModal }),
      ]
    })
  );
};

export default App;
