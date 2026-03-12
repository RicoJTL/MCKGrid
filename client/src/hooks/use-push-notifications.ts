import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const { data: vapidData } = useQuery({
    queryKey: ['/api/push/vapid-public-key'],
    staleTime: Infinity,
  });

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      // Check if already subscribed
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setIsSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!(vapidData as any)?.key) throw new Error('VAPID key not available');
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      if (permissionResult !== 'granted') throw new Error('Permission denied');

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array((vapidData as any).key),
      });

      await apiRequest('POST', '/api/push/subscribe', { subscription });
      setIsSubscribed(true);
      return subscription;
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) await subscription.unsubscribe();
      await apiRequest('POST', '/api/push/unsubscribe', {});
      setIsSubscribed(false);
    },
  });

  const requestPermissionAndSubscribe = async () => {
    if (isRegistering) return;
    setIsRegistering(true);
    try {
      await subscribeMutation.mutateAsync();
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    isRegistering,
    requestPermissionAndSubscribe,
    unsubscribe: unsubscribeMutation.mutate,
  };
}
