import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { Check, BellOff, Bell, Square } from 'lucide-react';
import { useEffect } from 'react';

export function Banners() {
    const { banner, hideBanner } = useAppStore();

    useEffect(() => {
        if (banner) {
            const timer = setTimeout(() => {
                hideBanner();
            }, 1500); // Briefly show banner, slightly longer than 1s for better readability

            return () => clearTimeout(timer);
        }
    }, [banner, hideBanner]);

    return (
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <AnimatePresence>
                {banner && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="mt-12 mx-4 px-6 py-3 rounded-full bg-[#2C2C2E] border border-[#3A3A3C] shadow-lg flex items-center space-x-3 pointer-events-auto"
                    >
                        {/* Icon Selection */}
                        {['ALARM_ENABLED'].includes(banner) && <Bell className="w-5 h-5 text-green-400" />}
                        {['ALARM_DISABLED'].includes(banner) && <BellOff className="w-5 h-5 text-gray-400" />}
                        {['ALARM_SAVED', 'TIME_SAVED'].includes(banner) && <Check className="w-5 h-5 text-blue-400" />}
                        {['SNOOZED', 'STOPPED'].includes(banner) && <Square className="w-5 h-5 text-yellow-400" />}

                        {/* Text Resolution */}
                        <span className="text-white font-medium text-sm">
                            {banner === 'ALARM_ENABLED' && 'Alarm enabled'}
                            {banner === 'ALARM_DISABLED' && 'Alarm disabled'}
                            {banner === 'ALARM_SAVED' && 'Alarm saved'}
                            {banner === 'TIME_SAVED' && 'Time saved'}
                            {banner === 'SNOOZED' && 'Snoozed'}
                            {banner === 'STOPPED' && 'Stopped'}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
