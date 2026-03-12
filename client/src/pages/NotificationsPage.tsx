import { useNotifications } from '@/hooks/use-notifications';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Check, Trophy, Sparkles, Layers, Flag, Calendar, BarChart2, ChevronUp, ChevronDown, Crown, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const NOTIFICATION_ICONS: Record<string, any> = {
  badge_unlocked: Trophy,
  icon_awarded: Sparkles,
  tier_movement: Layers,
  new_race: Flag,
  race_cancelled: AlertCircle,
  race_rescheduled: Calendar,
  race_results: BarChart2,
  race_day_reminder: Flag,
  checkin_reminder: AlertCircle,
  position_gained: ChevronUp,
  position_lost: ChevronDown,
  leader_changed: Crown,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  badge_unlocked: 'text-yellow-400',
  icon_awarded: 'text-purple-400',
  tier_movement: 'text-blue-400',
  new_race: 'text-green-400',
  race_cancelled: 'text-red-400',
  race_rescheduled: 'text-orange-400',
  race_results: 'text-primary',
  race_day_reminder: 'text-green-400',
  checkin_reminder: 'text-amber-400',
  position_gained: 'text-green-400',
  position_lost: 'text-red-400',
  leader_changed: 'text-yellow-400',
};

export default function NotificationsPage() {
  const { notifications, isLoading, unreadCount, markRead, markAllRead, isMarkingAllRead } = useNotifications();
  const { isSupported, permission, isSubscribed, isRegistering, requestPermissionAndSubscribe, unsubscribe } = usePushNotifications();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold italic">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isMarkingAllRead}
          >
            <Check className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {/* Push notification opt-in */}
      {isSupported && (
        <div className="p-4 rounded-2xl bg-secondary/30 border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              {isSubscribed ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div>
              <p className="font-medium text-sm">
                {isSubscribed ? 'Push notifications enabled' : 'Enable push notifications'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isSubscribed
                  ? "You'll receive notifications even when the app is closed"
                  : 'Get notified about races, results, and more'}
              </p>
            </div>
          </div>
          {permission === 'denied' ? (
            <p className="text-xs text-red-400">Blocked in browser settings</p>
          ) : isSubscribed ? (
            <Button variant="outline" size="sm" onClick={() => unsubscribe()}>
              Disable
            </Button>
          ) : (
            <Button size="sm" onClick={requestPermissionAndSubscribe} disabled={isRegistering}>
              {isRegistering ? 'Enabling...' : 'Enable'}
            </Button>
          )}
        </div>
      )}

      {/* Notification list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No notifications yet</p>
          <p className="text-sm mt-1">You'll see race updates, results, and more here</p>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          <div className="space-y-2">
            {notifications.map((notif) => {
              const Icon = NOTIFICATION_ICONS[notif.type] || Bell;
              const colorClass = NOTIFICATION_COLORS[notif.type] || 'text-primary';
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border transition-colors cursor-pointer ${
                    notif.read
                      ? 'bg-secondary/20 border-white/5'
                      : 'bg-secondary/40 border-white/15'
                  }`}
                  onClick={() => {
                    if (!notif.read) markRead(notif.id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white/5 mt-0.5 flex-shrink-0">
                      <Icon className={`w-4 h-4 ${colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold text-sm ${notif.read ? 'text-white/70' : 'text-white'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
