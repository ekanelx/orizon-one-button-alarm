import { useEffect, useState, useMemo } from 'react';
import { Banners } from './components/Banners';
import { ActionButton } from './components/ActionButton';
import { TimeDisplay } from './components/TimeDisplay';
import { StatusChip } from './components/StatusChip';
import { useAppStore } from './store/appStore';
import { Clock as ClockIcon, Bell as AlarmIcon, Settings2, BellRing } from 'lucide-react';

function App() {
  const {
    mode,
    setMode,
    alarmTime,
    isEnabled,
    toggleAlarm,
    incrementAlarmHour,
    incrementAlarmMinute,
    currentTimeOffset,
    incrementCurrentTimeHour,
    incrementCurrentTimeMinute,
    showBanner,
    snoozeTime,
    setSnoozeTime
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute actual displayed time (factoring in the demo offset if used)
  const displayTime = useMemo(() => {
    const time = new Date(currentTime);
    time.setHours(time.getHours() + currentTimeOffset.h);
    time.setMinutes(time.getMinutes() + currentTimeOffset.m);
    return time;
  }, [currentTime, currentTimeOffset.h, currentTimeOffset.m]);

  // Check for Ringing Condition
  useEffect(() => {
    if (!isEnabled || (mode !== 'CLOCK' && mode !== 'ALARM')) return;

    const isTopOfMinute = displayTime.getSeconds() === 0;
    const isSnoozeDue =
      snoozeTime !== null &&
      displayTime.getHours() === snoozeTime.getHours() &&
      displayTime.getMinutes() === snoozeTime.getMinutes();

    const isAlarmTime =
      displayTime.getHours() === alarmTime.h &&
      displayTime.getMinutes() === alarmTime.m;

    if (isTopOfMinute && (isSnoozeDue || (snoozeTime === null && isAlarmTime))) {
      if (isSnoozeDue) {
        setSnoozeTime(null);
      }
      setMode('RINGING');
    }
  }, [displayTime, isEnabled, alarmTime, snoozeTime, mode, setMode, setSnoozeTime]);

  // View Resolution Logic
  const renderHeader = () => {
    switch (mode) {
      case 'CLOCK':
        return <><ClockIcon className="w-5 h-5 mr-2" /> Clock</>;
      case 'ALARM':
        return <><AlarmIcon className="w-5 h-5 mr-2" /> Alarm</>;
      case 'SET_ALARM_HH':
      case 'SET_ALARM_MM':
        return <><Settings2 className="w-5 h-5 mr-2" /> Set alarm</>;
      case 'SET_TIME_HH':
      case 'SET_TIME_MM':
        return <><Settings2 className="w-5 h-5 mr-2" /> Set time</>;
      case 'RINGING':
        return <><BellRing className="w-5 h-5 mr-2 text-[#FF453A]" /> <span className="text-[#FF453A]">Ringing</span></>;
    }
  };

  const getTimeToDisplay = () => {
    if (mode.startsWith('SET_ALARM') || mode === 'ALARM') {
      return alarmTime;
    }
    return { h: displayTime.getHours(), m: displayTime.getMinutes() };
  };

  const getActionProps = () => {
    switch (mode) {
      case 'CLOCK':
        return {
          onTap: () => setMode('ALARM'),
          onHold: () => setMode('SET_TIME_HH'),
          hintText: 'Tap: Alarm · Hold: Set time'
        };
      case 'ALARM':
        return {
          onTap: () => setMode('CLOCK'),
          onDoubleTap: toggleAlarm,
          onHold: () => setMode('SET_ALARM_HH'),
          hintText: 'Tap: Clock · Hold: Set alarm'
        };
      case 'SET_ALARM_HH':
        return {
          onTap: incrementAlarmHour,
          onHold: () => setMode('SET_ALARM_MM'),
          hintText: 'Tap: +1 hour · Hold: Minutes'
        };
      case 'SET_ALARM_MM':
        return {
          onTap: incrementAlarmMinute,
          onHold: () => {
            setMode('ALARM');
            showBanner('ALARM_SAVED');
          },
          hintText: 'Tap: +1 minute · Hold: Save'
        };
      case 'SET_TIME_HH':
        return {
          onTap: incrementCurrentTimeHour,
          onHold: () => setMode('SET_TIME_MM'),
          hintText: 'Tap: +1 hour · Hold: Minutes'
        };
      case 'SET_TIME_MM':
        return {
          onTap: incrementCurrentTimeMinute,
          onHold: () => {
            setMode('CLOCK');
            showBanner('TIME_SAVED');
          },
          hintText: 'Tap: +1 minute · Hold: Save'
        };
      case 'RINGING':
        return {
          onTap: () => {
            // Snooze
            const next = new Date(displayTime);
            next.setMinutes(next.getMinutes() + 9);
            setSnoozeTime(next);
            showBanner('SNOOZED');
            setMode('CLOCK');
          },
          onHold: () => {
            // Stop
            setSnoozeTime(null);
            showBanner('STOPPED');
            setMode('CLOCK');
          },
          hintText: 'Tap: Snooze · Hold: Stop'
        };
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black font-sans">
      {/* Mobile Device Constraint Wrapper */}
      <div
        className="relative w-full max-w-[402px] h-[100dvh] max-h-[874px] overflow-hidden flex flex-col sm:border sm:border-[#3A3A3C] sm:rounded-[40px] shadow-2xl"
        style={{ backgroundImage: "url('/background.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      >

        <Banners />

        {/* Ringing Background Pulse Overlay */}
        {mode === 'RINGING' && (
          <div className="absolute inset-0 bg-[#FF453A] opacity-20 animate-pulse pointer-events-none" />
        )}

        {/* Header */}
        <div className="pt-[96px] pb-[16px] flex items-center justify-center text-white font-normal text-[32px] tracking-[-0.64px]">
          {renderHeader()}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col items-center px-4 w-full mt-[32px]">

          <TimeDisplay time={getTimeToDisplay()} />
          <StatusChip />

        </div>

        {/* Persistent Action Control */}
        <ActionButton {...getActionProps()} />
      </div>
    </div>
  );
}

export default App;
