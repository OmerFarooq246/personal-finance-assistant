import type { Icon } from "iconsax-react";
import {
  Add,
  AddCircle,
  ArrowDown,
  ArrowLeft2,
  ArrowRight2,
  ArrowSwapHorizontal,
  ArrowUp,
  Bank,
  Card,
  Car,
  Category,
  CloudAdd,
  Danger,
  DocumentDownload,
  DocumentText,
  DocumentUpload,
  Edit2,
  Electricity,
  GasStation,
  Gallery,
  GallerySlash,
  Health,
  Home,
  InfoCircle,
  Logout,
  Menu,
  Message,
  Money4,
  MoneyRecive,
  More,
  Profile,
  Receipt,
  ReceiptText,
  Refresh,
  Reserve,
  SearchNormal,
  Send,
  Setting2,
  ShoppingBag,
  ShoppingCart,
  TickCircle,
  Video,
  Wallet3,
  Warning2,
} from "iconsax-react";
import { cn } from "@/lib/finance";

type MaterialIconProps = {
  name: string;
  filled?: boolean;
  className?: string;
  title?: string;
};

const iconMap: Record<string, Icon> = {
  account_balance: Bank,
  account_balance_wallet: Wallet3,
  add: Add,
  add_circle: AddCircle,
  arrow_downward: ArrowDown,
  arrow_upward: ArrowUp,
  bolt: Electricity,
  chat: Message,
  chat_bubble: Message,
  check_circle: TickCircle,
  chevron_left: ArrowLeft2,
  chevron_right: ArrowRight2,
  cloud_upload: CloudAdd,
  credit_card: Card,
  dashboard: Category,
  description: DocumentText,
  directions_car: Car,
  download: DocumentDownload,
  edit_note: Edit2,
  error: Danger,
  help: InfoCircle,
  home: Home,
  image: Gallery,
  image_not_supported: GallerySlash,
  info: InfoCircle,
  local_gas_station: GasStation,
  logout: Logout,
  medical_services: Health,
  memory: Setting2,
  menu: Menu,
  more_horiz: More,
  movie: Video,
  payments: MoneyRecive,
  person: Profile,
  picture_as_pdf: DocumentText,
  receipt: Receipt,
  receipt_long: ReceiptText,
  restaurant: Reserve,
  rule: Warning2,
  search: SearchNormal,
  send: Send,
  shopping_bag: ShoppingBag,
  shopping_cart: ShoppingCart,
  smart_toy: Money4,
  sync: Refresh,
  sync_alt: ArrowSwapHorizontal,
  upload_file: DocumentUpload,
};

export function MaterialIcon({ name, filled = false, className, title }: MaterialIconProps) {
  const IconComponent = iconMap[name] ?? InfoCircle;

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center align-middle", className)} title={title}>
      <IconComponent aria-hidden={!title} aria-label={title} color="currentColor" size="1em" variant={filled ? "Bold" : "Linear"} />
    </span>
  );
}
