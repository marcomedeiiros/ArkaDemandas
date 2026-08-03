export {
  Search as SearchIcon,
  Plus as PlusIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  Copy as CopyIcon,
  MoreVertical as MoreVerticalIcon,
  X as XIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Folder as FolderIcon,
  User as UserIcon,
  Building2 as Building2Icon,
  ClipboardList as ClipboardListIcon,
  Activity as ActivityIcon,
  Flame as FlameIcon,
  CheckCircle2 as CheckCircle2Icon,
  CalendarDays as CalendarDaysIcon,
  BarChart2 as BarChart2Icon,
  History as HistoryIcon,
  Monitor as MonitorIcon,
  Target as TargetIcon,
  AlertTriangle as AlertTriangleIcon,
  // extras used in modal / dashboard
  Monitor as MonitorSmallIcon,
  Save as SaveIcon,
  FilePlus as FilePlusIcon,
  Timer as TimerIcon,
  Globe as GlobeIcon,
  Sun as SunIcon,
  CalendarCheck as CalendarCheckIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Filter as FilterIcon,
  Package as PackageIcon,
  CheckCheck as CheckCheckIcon,
  Rocket as RocketIcon,
} from 'lucide-react';

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  MoreVertical,
  X,
  Calendar,
  Clock,
  Folder,
  User,
  Building2,
  ClipboardList,
  Activity,
  Flame,
  CheckCircle2,
  CalendarDays,
  BarChart2,
  History,
  Monitor,
  Target,
  AlertTriangle,
  type LucideProps,
} from 'lucide-react';

const LucideIcons = {
  search:        Search,
  plus:          Plus,
  edit:          Pencil,
  delete:        Trash2,
  copy:          Copy,
  moreVertical:  MoreVertical,
  close:         X,
  calendar:      Calendar,
  clock:         Clock,
  folder:        Folder,
  user:          User,
  building:      Building2,
  clipboard:     ClipboardList,
  activity:      Activity,
  flame:         Flame,
  checkCircle:   CheckCircle2,
  calendarDays:  CalendarDays,
  barChart:      BarChart2,
  history:       History,
  monitor:       Monitor,
  target:        Target,
  alertTriangle: AlertTriangle,
};

export type IconName = keyof typeof LucideIcons;

// Garante um ícone válido: colunas custom podem trazer um nome desconhecido.
export function safeIconName(name: string): IconName {
  return (name in LucideIcons ? name : 'clipboard') as IconName;
}

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 16, className, ...props }: IconProps) {
  const LucideComponent = LucideIcons[name];
  return (
    <LucideComponent
      size={size}
      className={className}
      {...props}
    />
  );
}