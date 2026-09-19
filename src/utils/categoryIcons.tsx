import React from 'react';
import { 
  Heart,
  HeartHandshake,
  Smile,
  Flower2,
  Baby,
  Users,
  User,
  Flame,
  Activity,
  Brain,
  Leaf,
  Ear,
  Eye,
  Accessibility,
  Footprints,
  Dumbbell,
  Sun,
  Moon,
  MessageSquare,
  MessageCircle,
  MessagesSquare,
  Phone,
  Mail,
  Share2,
  Briefcase,
  Home,
  Coffee,
  TrendingUp,
  ShieldCheck,
  Shield,
  UserPlus,
  BookOpen,
  Award,
  GraduationCap,
  Medal,
  Milestone,
  Target,
  Trophy,
  Key,
  Lock,
  Unlock,
  Lightbulb,
  MapPin,
  Globe,
  Anchor,
  Search,
  Settings,
  HelpCircle,
  Music,
  Tv,
  Camera,
  ImageIcon,
  Calendar,
  Clock,
  Gift,
  Bell,
  Crown,
  Book,
  PenTool,
  Palette,
  Video,
  Cloud,
  Wind,
  Zap,
  SmilePlus,
  Gem,
  HeartCrack,
  Workflow,
  HeartPulse
} from 'lucide-react';

// Organized list of over 70+ premium icons suited for Category selections
export const PREMIUM_ICONS_BY_GROUP = [
  {
    group: 'Emotional & Relational',
    icons: [
      { name: 'Heart', component: Heart, label: 'Lover Heart' },
      { name: 'HeartPulse', component: HeartPulse, label: 'Heart Pulse' },
      { name: 'HeartHandshake', component: HeartHandshake, label: 'Heart Handshake' },
      { name: 'HeartCrack', component: HeartCrack, label: 'Heart Crack' },
      { name: 'Smile', component: Smile, label: 'Gentle Smile' },
      { name: 'SmilePlus', component: SmilePlus, label: 'Enthusiastic Smile' },
      { name: 'Users', component: Users, label: 'Group Union' },
      { name: 'User', component: User, label: 'Individual Essence' },
      { name: 'UserPlus', component: UserPlus, label: 'Growing Connection' },
      { name: 'Flame', component: Flame, label: 'Relational Spark' },
      { name: 'Baby', component: Baby, label: 'Nurtured Inner Child' }
    ]
  },
  {
    group: 'Mind & Somatic Healing',
    icons: [
      { name: 'Brain', component: Brain, label: 'Cognitive Mind' },
      { name: 'Activity', component: Activity, label: 'Somatic Flow' },
      { name: 'Leaf', component: Leaf, label: 'Organic Recovery' },
      { name: 'Flower2', component: Flower2, label: 'Resilient Bloom' },
      { name: 'Ear', component: Ear, label: 'Empathetic Audition (Ear)' },
      { name: 'Eye', component: Eye, label: 'Conscious Awareness (Eye)' },
      { name: 'Accessibility', component: Accessibility, label: 'Body Inclusion' },
      { name: 'Footprints', component: Footprints, label: 'Slow Courting steps' },
      { name: 'Dumbbell', component: Dumbbell, label: 'Psychological Grit' },
      { name: 'Sun', component: Sun, label: 'Ventral Radiance' },
      { name: 'Moon', component: Moon, label: 'Dorsal Quietude' }
    ]
  },
  {
    group: 'Growth & Intent',
    icons: [
      { name: 'TrendingUp', component: TrendingUp, label: 'Earned Security' },
      { name: 'Target', component: Target, label: 'Relational Focus' },
      { name: 'Award', component: Award, label: 'Relational Win' },
      { name: 'Trophy', component: Trophy, label: 'Commitment Crown' },
      { name: 'Medal', component: Medal, label: 'Praising Honor' },
      { name: 'Gem', component: Gem, label: 'Relational Gem' },
      { name: 'Milestone', component: Milestone, label: 'Boundary Marker' },
      { name: 'GraduationCap', component: GraduationCap, label: 'Expert Wisdom' },
      { name: 'BookOpen', component: BookOpen, label: 'Spacious Log' },
      { name: 'Book', component: Book, label: 'Hardcover Narrative' },
      { name: 'Key', component: Key, label: 'Attachment Key' },
      { name: 'Lock', component: Lock, label: 'Safe Shield' },
      { name: 'Unlock', component: Unlock, label: 'Vulnerable Trust' },
      { name: 'ShieldCheck', component: ShieldCheck, label: 'Secure Agreement' },
      { name: 'Shield', component: Shield, label: 'Tender boundaries' }
    ]
  },
  {
    group: 'Communication & Expression',
    icons: [
      { name: 'MessageSquare', component: MessageSquare, label: 'Secure Dialogue' },
      { name: 'MessageCircle', component: MessageCircle, label: 'Cozy Conversing' },
      { name: 'MessagesSquare', component: MessagesSquare, label: 'Guided Group Discussion' },
      { name: 'Phone', component: Phone, label: 'Synchronous Voice Call' },
      { name: 'Mail', component: Mail, label: 'Loving Letters' },
      { name: 'PenTool', component: PenTool, label: 'Journaling Pen' },
      { name: 'Palette', component: Palette, label: 'Expressive Arts' },
      { name: 'Music', component: Music, label: 'Co-regulating Melodies' },
      { name: 'Share2', component: Share2, label: 'Vulnerable Sharing' },
      { name: 'Coffee', component: Coffee, label: 'Cozy Coffee Date' },
      { name: 'Home', component: Home, label: 'Secure Co-habitation' },
      { name: 'Briefcase', component: Briefcase, label: 'Workplace Attachment' }
    ]
  },
  {
    group: 'Aesthetic Emblems',
    icons: [
      { name: 'Award', component: Award, label: 'Prestige Rating' },
      { name: 'Crown', component: Crown, label: 'Sovereignty' },
      { name: 'Gem', component: Gem, label: 'Invaluable Insight' },
      { name: 'Lightbulb', component: Lightbulb, label: 'Gottman Breakthrough' },
      { name: 'Globe', component: Globe, label: 'Universal Attachment' },
      { name: 'MapPin', component: MapPin, label: 'Sensory Location' },
      { name: 'Anchor', component: Anchor, label: 'Grounding Anchor' },
      { name: 'Zap', component: Zap, label: 'High Energy' },
      { name: 'Cloud', component: Cloud, label: 'Soft Atmosphere' },
      { name: 'Wind', component: Wind, label: 'Fresh Breath' },
      { name: 'Clock', component: Clock, label: 'Steady Pacing' },
      { name: 'Calendar', component: Calendar, label: 'Curated Dates' },
      { name: 'Gift', component: Gift, label: 'Warm Presence' },
      { name: 'Bell', component: Bell, label: 'Mindset Reminders' },
      { name: 'Camera', component: Camera, label: 'Capturing Beauty' },
      { name: 'ImageIcon', component: ImageIcon, label: 'Somatic Framing' },
      { name: 'Video', component: Video, label: 'Live Attachment' },
      { name: 'Tv', component: Tv, label: 'Shared Recreation' },
      { name: 'Workflow', component: Workflow, label: 'Relational Worksheets' },
      { name: 'Search', component: Search, label: 'Conscious Seeking' },
      { name: 'Settings', component: Settings, label: 'Recalibrating Patterns' },
      { name: 'HelpCircle', component: HelpCircle, label: 'Curious Wondering' }
    ]
  }
];

// Flat list for fast search and lookup
export const ALL_PREMIUM_ICONS = PREMIUM_ICONS_BY_GROUP.reduce((acc, current) => {
  return acc.concat(current.icons);
}, [] as { name: string; component: React.ComponentType<any>; label: string }[]);

/**
 * Returns a premium Lucide React icon element for a given icon name or category slug.
 */
export function getCategoryIcon(iconNameOrSlug: string, className = "w-4 h-4") {
  if (!iconNameOrSlug) {
    return <Flame className={className} />;
  }

  // Exact Match against registration names
  const matches = ALL_PREMIUM_ICONS.find(
    i => i.name.toLowerCase() === iconNameOrSlug.toLowerCase()
  );
  if (matches) {
    const Comp = matches.component;
    return <Comp className={className} />;
  }

  // Secondary backup: check substring matches matching the slug
  const norm = iconNameOrSlug.toLowerCase();
  
  if (norm.includes('wellness') || norm.includes('emotional') || norm.includes('heart')) {
    return <Heart className={className} />;
  }
  if (norm.includes('science') || norm.includes('relationship') || norm.includes('handshake')) {
    return <HeartHandshake className={className} />;
  }
  if (norm.includes('dating') || norm.includes('sparkle') || norm.includes('chemistry')) {
    return <Flame className={className} />;
  }
  if (norm.includes('growth') || norm.includes('self-growth') || norm.includes('trending') || norm.includes('personal')) {
    return <TrendingUp className={className} />;
  }
  if (norm.includes('somatic') || norm.includes('healing') || norm.includes('activity')) {
    return <Activity className={className} />;
  }
  if (norm.includes('communication') || norm.includes('message')) {
    return <MessageSquare className={className} />;
  }
  if (norm.includes('intimacy') || norm.includes('secure-intimacy') || norm.includes('secure') || norm.includes('shield')) {
    return <ShieldCheck className={className} />;
  }
  if (norm.includes('inner') || norm.includes('work') || norm.includes('user')) {
    return <UserPlus className={className} />;
  }
  if (norm.includes('red-flag') || norm.includes('redflags') || norm.includes('toxic') || norm.includes('crack')) {
    return <HeartCrack className={className} />;
  }
  if (norm.includes('breakup')) {
    return <Activity className={className} />;
  }
  if (norm.includes('marriage') || norm.includes('commitment')) {
    return <ShieldCheck className={className} />;
  }
  if (norm.includes('intimacy') || norm.includes('romance') || norm.includes('flame')) {
    return <Flame className={className} />;
  }
  if (norm.includes('family') || norm.includes('parenting')) {
    return <Users className={className} />;
  }
  if (norm.includes('psychology') || norm.includes('brain')) {
    return <Brain className={className} />;
  }
  
  // Return Flame as graceful default
  return <Flame className={className} />;
}
