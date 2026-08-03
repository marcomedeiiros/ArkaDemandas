import { useState, useRef } from 'react';
import {
  ArrowLeft, User, Briefcase, Mail, Camera, Trash2, KeyRound,
  Save, ShieldAlert, Check, AlertTriangle, X,
} from 'lucide-react';
import type { AuthUser, ProfileUpdate } from '../../hooks/useAuth';

interface SettingsPageProps {
  user: AuthUser;
  onUpdateProfile: (fields: ProfileUpdate) => Promise<AuthUser>;
  onChangePassword: (current: string, next: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onBack: () => void;
}

function initials(name?: string): string {
  if (!name) return '?';
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}

// Redimensiona/recorta a imagem para um quadrado pequeno (data URL leve)
function fileToAvatar(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponível'));
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Imagem inválida'));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

type Msg = { type: 'ok' | 'err'; text: string } | null;

export default function SettingsPage({ user, onUpdateProfile, onChangePassword, onDeleteAccount, onBack }: SettingsPageProps) {
  const [name, setName] = useState(user.name);
  const [cargo, setCargo] = useState(user.cargo ?? '');
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState<string | null>(user.avatar_url);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<Msg>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isLocal = user.provider === 'local';
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<Msg>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const pickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setProfileMsg({ type: 'err', text: 'Selecione um arquivo de imagem' }); return; }
    try {
      const dataUrl = await fileToAvatar(file);
      setAvatar(dataUrl);
    } catch {
      setProfileMsg({ type: 'err', text: 'Não foi possível processar a imagem' });
    }
  };

  const saveProfile = async () => {
    setProfileMsg(null);
    if (!name.trim()) { setProfileMsg({ type: 'err', text: 'Informe seu nome' }); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setProfileMsg({ type: 'err', text: 'E-mail inválido' }); return; }
    setSavingProfile(true);
    try {
      await onUpdateProfile({ name: name.trim(), cargo: cargo.trim() || null, email: email.trim(), avatar_url: avatar });
      setProfileMsg({ type: 'ok', text: 'Perfil atualizado com sucesso' });
    } catch (err) {
      setProfileMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao salvar' });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setPwMsg(null);
    if (newPw.length < 6) { setPwMsg({ type: 'err', text: 'A nova senha deve ter ao menos 6 caracteres' }); return; }
    if (newPw !== confirmPw) { setPwMsg({ type: 'err', text: 'As senhas não coincidem' }); return; }
    setSavingPw(true);
    try {
      await onChangePassword(currentPw, newPw);
      setPwMsg({ type: 'ok', text: 'Senha redefinida com sucesso' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao redefinir senha' });
    } finally {
      setSavingPw(false);
    }
  };

  const doDelete = async () => {
    setDeleting(true);
    try {
      await onDeleteAccount();
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-5 max-w-3xl mx-auto w-full">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}
            title="Voltar"
          >
            <ArrowLeft size={17} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Configurações</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Gerencie os dados da sua conta</p>
          </div>
        </div>

        {/* ── Perfil ── */}
        <Card title="Perfil" subtitle="Foto, nome, cargo e e-mail">
          <div className="flex items-center gap-4 mb-5">
            <div className="relative">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-16 h-16 rounded-full object-cover" style={{ border: '2px solid rgba(0,102,255,0.4)' }} />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl"
                  style={{ background: 'rgba(0,102,255,0.18)', border: '2px solid rgba(0,102,255,0.4)', color: '#4D94FF' }}
                >
                  {initials(name)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="btn-secondary flex items-center gap-2"
                style={{ height: '38px', padding: '0 14px', fontSize: '0.82rem' }}
              >
                <Camera size={15} /> Trocar foto
              </button>
              {avatar && (
                <button
                  onClick={() => setAvatar(null)}
                  className="flex items-center gap-1.5 rounded-xl transition-all hover:bg-red-500/10"
                  style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <X size={14} /> Remover
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field icon={<User size={14} />} label="Nome" value={name} onChange={setName} />
            <Field icon={<Briefcase size={14} />} label="Cargo" value={cargo} onChange={setCargo} placeholder="Ex.: Técnico de TI" />
          </div>
          <div className="mt-3">
            <Field icon={<Mail size={14} />} label="E-mail" value={email} onChange={setEmail} type="email" />
          </div>

          {profileMsg && <FeedbackMsg msg={profileMsg} />}

          <div className="flex justify-end mt-4">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
              style={{ height: '40px', padding: '0 20px', fontSize: '0.85rem' }}
            >
              {savingProfile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
              Salvar perfil
            </button>
          </div>
        </Card>

        {/* ── Senha ── */}
        <Card title="Redefinir senha" subtitle={isLocal ? 'Informe a senha atual e a nova senha' : 'Defina uma senha para acessar também por e-mail'}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {isLocal && (
              <Field icon={<KeyRound size={14} />} label="Senha atual" value={currentPw} onChange={setCurrentPw} type="password" />
            )}
            <Field icon={<KeyRound size={14} />} label="Nova senha" value={newPw} onChange={setNewPw} type="password" />
            <Field icon={<KeyRound size={14} />} label="Confirmar" value={confirmPw} onChange={setConfirmPw} type="password" />
          </div>

          {pwMsg && <FeedbackMsg msg={pwMsg} />}

          <div className="flex justify-end mt-4">
            <button
              onClick={savePassword}
              disabled={savingPw}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
              style={{ height: '40px', padding: '0 20px', fontSize: '0.85rem' }}
            >
              {savingPw ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <KeyRound size={15} />}
              Redefinir senha
            </button>
          </div>
        </Card>

        {/* ── Zona de perigo ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert size={18} style={{ color: '#F87171' }} />
            <h3 className="font-bold text-white">Zona de perigo</h3>
          </div>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Deletar sua conta é permanente e não pode ser desfeito.
          </p>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn-danger flex items-center gap-2"
              style={{ height: '40px', padding: '0 18px', fontSize: '0.85rem' }}
            >
              <Trash2 size={15} /> Deletar minha conta
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold" style={{ color: '#FCA5A5' }}>Tem certeza? Esta ação é irreversível.</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="btn-secondary"
                  style={{ height: '38px', padding: '0 16px', fontSize: '0.82rem' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={doDelete}
                  disabled={deleting}
                  className="btn-danger flex items-center gap-2 disabled:opacity-60"
                  style={{ height: '38px', padding: '0 16px', fontSize: '0.82rem' }}
                >
                  {deleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 size={14} />}
                  Sim, deletar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Subcomponentes ───────────────────────────────────────────────────────────
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(21,25,34,0.88)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="mb-4">
        <h3 className="font-bold text-white">{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({
  icon, label, value, onChange, type = 'text', placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 mb-1.5" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-premium w-full"
        style={{ height: '40px' }}
      />
    </div>
  );
}

function FeedbackMsg({ msg }: { msg: { type: 'ok' | 'err'; text: string } }) {
  const ok = msg.type === 'ok';
  return (
    <div
      className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs"
      style={{
        background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${ok ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.28)'}`,
        color: ok ? '#6EE7A0' : '#FCA5A5',
      }}
    >
      {ok ? <Check size={14} /> : <AlertTriangle size={14} />}
      {msg.text}
    </div>
  );
}
