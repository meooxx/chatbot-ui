import { SupportedExportFormats } from '@/types/export';
import {
  IconFileExport,
  IconMoon,
  IconSun,
  IconLogin,
  IconLogout,
} from '@tabler/icons-react';
import { useTranslation } from 'next-i18next';
import { FC, useState } from 'react';
import { Import } from '../Settings/Import';
import { Key } from '../Settings/Key';
import { SidebarButton } from '../Sidebar/SidebarButton';
import { ClearConversations } from './ClearConversations';
// import { LoginModal } from './loginModal';
// import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { sign } from 'node:crypto';
interface Props {
  lightMode: 'light' | 'dark';
  apiKey: string;
  conversationsCount: number;
  onToggleLightMode: (mode: 'light' | 'dark') => void;
  onApiKeyChange: (apiKey: string) => void;
  onClearConversations: () => void;
  onExportConversations: () => void;
  onImportConversations: (data: SupportedExportFormats) => void;
}

export const ChatbarSettings: FC<Props> = ({
  lightMode,
  apiKey,
  conversationsCount,
  onToggleLightMode,
  onApiKeyChange,
  onClearConversations,
  onExportConversations,
  onImportConversations,
}) => {
  const { t } = useTranslation('sidebar');
  const session = useSession();
  const router = useRouter();
  return (
    <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
      {conversationsCount > 0 ? (
        <ClearConversations onClearConversations={onClearConversations} />
      ) : null}

      <Import onImport={onImportConversations} />

      <SidebarButton
        text={t('Export data')}
        icon={<IconFileExport size={18} />}
        onClick={() => onExportConversations()}
      />

      <SidebarButton
        text={lightMode === 'light' ? t('Dark mode') : t('Light mode')}
        icon={
          lightMode === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />
        }
        onClick={() =>
          onToggleLightMode(lightMode === 'light' ? 'dark' : 'light')
        }
      />
      {/* @ts-expect-error */}
      {(!session.data?.user.userId && (
        <SidebarButton
          text={t('Login')}
          icon={<IconLogin size={18} />}
          onClick={() => router.push('/api/auth/signin')}
        />
      )) || (
        // todo
        <SidebarButton
          text={t('Logout')}
          icon={<IconLogout size={18} />}
          onClick={() => signOut()}
        />
      )}

      <Key apiKey={apiKey} onApiKeyChange={onApiKeyChange} />
    </div>
  );
};
