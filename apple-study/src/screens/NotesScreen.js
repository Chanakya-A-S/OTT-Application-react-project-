import React, { useMemo, useState } from 'react';
import { View, Pressable, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, T, shadow } from '../theme';
import { Screen, Field, Chip, Grad, Card, Empty, Row, tap } from '../components/ui';
import Icon from '../components/Icon';
import { useStore, live, subjectOf } from '../store';
import { imageUri } from '../images';
import { relTime } from '../utils/date';

export const NOTE_COLORS = {
  none: { light: null, dark: null },
  yellow: { light: '#FFF4D6', dark: '#3A3220' },
  pink: { light: '#FFE3EC', dark: '#3A2230' },
  blue: { light: '#E3EDFF', dark: '#1F2A42' },
  green: { light: '#DDF5EA', dark: '#1D3329' },
  purple: { light: '#EEE6FF', dark: '#2C2342' },
};

export const preview = (n) =>
  (n.blocks || [])
    .filter((b) => b.type !== 'image' && b.text)
    .map((b) => (b.type === 'check' ? `${b.done ? '☑' : '☐'} ${b.text}` : b.text))
    .join('\n');

function NoteCard({ note, subjects, onPress }) {
  const c = useTheme();
  const img = (note.blocks || []).find((b) => b.type === 'image');
  const s = note.subjectId ? subjectOf(subjects, note.subjectId) : null;
  const bg = NOTE_COLORS[note.color || 'none']?.[c.dark ? 'dark' : 'light'];
  return (
    <Card style={{ padding: 10, marginBottom: 12, backgroundColor: bg || c.card }} onPress={onPress}>
      {img && (
        <Image
          source={{ uri: imageUri(img.imageId) }}
          style={{ width: '100%', aspectRatio: Math.max(0.75, Math.min(1.6, (img.w || 4) / (img.h || 3))), borderRadius: 14, backgroundColor: c.soft }}
          resizeMode="cover"
        />
      )}
      <View style={{ paddingHorizontal: 4, paddingTop: img ? 8 : 4, paddingBottom: 2 }}>
        <Row gap={4}>
          {note.pinned && <T size={12}>📌</T>}
          <T w={700} size={14} numberOfLines={2} style={{ flex: 1 }}>
            {note.title || 'Untitled'}
          </T>
        </Row>
        <T size={11} muted numberOfLines={img ? 3 : 7} style={{ marginTop: 3, lineHeight: 16 }}>
          {preview(note)}
        </T>
        <T w={600} size={10} color={s ? s.color : c.muted} style={{ marginTop: 6 }}>
          {s ? `${s.name} · ` : ''}
          {relTime(note.updatedAt)}
        </T>
      </View>
    </Card>
  );
}

export default function NotesScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const notesAll = useStore((s) => s.notes);
  const subjects = useStore((s) => s.subjects);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const notes = useMemo(() => live(notesAll), [notesAll]);
  const usedSubjects = useMemo(() => {
    const ids = new Set(notes.map((n) => n.subjectId).filter(Boolean));
    return live(subjects).filter((s) => ids.has(s.id));
  }, [notes, subjects]);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return notes
      .filter((n) => (filter === 'all' ? true : filter === 'pinned' ? n.pinned : n.subjectId === filter))
      .filter((n) => !ql || (n.title || '').toLowerCase().includes(ql) || preview(n).toLowerCase().includes(ql))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
  }, [notes, q, filter]);

  const cols = [[], []];
  list.forEach((n, i) => cols[i % 2].push(n));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Screen scroll>
        <Row between style={{ marginTop: 6 }}>
          <T w={700} size={24}>
            Notes
          </T>
          <T w={600} size={12} muted>
            {notes.length} note{notes.length === 1 ? '' : 's'}
          </T>
        </Row>
        <Field icon="search" placeholder="Search notes…" value={q} onChangeText={setQ} style={{ marginTop: 14 }} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 6 }}>
          <Chip label={`All ${notes.length}`} on={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="📌 Pinned" on={filter === 'pinned'} onPress={() => setFilter('pinned')} />
          {usedSubjects.map((s) => (
            <Chip key={s.id} label={s.name} dot={s.color} color={s.color} on={filter === s.id} onPress={() => setFilter(s.id)} />
          ))}
        </ScrollView>
        {list.length === 0 ? (
          <Empty emoji="📝" title={q ? 'No matching notes' : 'No notes yet'} sub="Tap the pencil to write a note — add text, checklists and photos." />
        ) : (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            {cols.map((col, i) => (
              <View key={i} style={{ flex: 1 }}>
                {col.map((n) => (
                  <NoteCard key={n.id} note={n} subjects={subjects} onPress={() => nav.navigate('NoteEditor', { id: n.id })} />
                ))}
              </View>
            ))}
          </View>
        )}
      </Screen>
      <Pressable
        onPress={() => {
          tap();
          nav.navigate('NoteEditor', { subjectId: filter !== 'all' && filter !== 'pinned' ? filter : null });
        }}
        style={{ position: 'absolute', right: 20, bottom: 110 }}
      >
        <Grad style={[{ width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, shadow(c, true)]}>
          <Icon name="edit" size={24} color="#fff" width={2.4} />
        </Grad>
      </Pressable>
    </View>
  );
}
