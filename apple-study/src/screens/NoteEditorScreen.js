import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, TextInput, Image, Alert, KeyboardAvoidingView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, T, FONTS, shadow } from '../theme';
import { IconBtn, Chip, CheckBox, Row, tap } from '../components/ui';
import Icon from '../components/Icon';
import { useStore, live, subjectOf } from '../store';
import { pickImage, imageUri, deleteImage } from '../images';
import { relTime, uid } from '../utils/date';
import { NOTE_COLORS } from './NotesScreen';

const W = Dimensions.get('window').width - 40;

export default function NoteEditorScreen() {
  const c = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { params = {} } = useRoute();
  const upsert = useStore((s) => s.upsert);
  const remove = useStore((s) => s.remove);
  const subjects = useStore((s) => s.subjects);
  const existing = params.id ? useStore.getState().notes.find((n) => n.id === params.id) : null;

  const [note, setNote] = useState(
    () =>
      existing || {
        id: uid(),
        title: '',
        subjectId: params.subjectId || null,
        pinned: false,
        color: 'none',
        blocks: [{ id: uid(), type: 'text', text: '' }],
        isNew: true,
      }
  );
  const [showSubjects, setShowSubjects] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const dirty = useRef(false);
  const latest = useRef(note);
  latest.current = note;
  const deletedRef = useRef(false);

  const isEmpty = (n) => !n.title.trim() && !(n.blocks || []).some((b) => b.type === 'image' || (b.text || '').trim());

  const persist = () => {
    if (deletedRef.current || !dirty.current) return;
    const n = latest.current;
    if (isEmpty(n)) return;
    const { isNew, ...rest } = n;
    upsert('notes', rest);
    dirty.current = false;
  };

  useEffect(() => {
    const t = setTimeout(persist, 700);
    return () => clearTimeout(t);
  });
  useEffect(() => () => persist(), []); // save on leave

  const update = (patch) => {
    dirty.current = true;
    setNote((n) => ({ ...n, ...patch }));
  };
  const setBlock = (id, patch) => update({ blocks: latest.current.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
  const insertBlock = (block) => {
    const blocks = [...latest.current.blocks];
    const idx = focusId ? blocks.findIndex((b) => b.id === focusId) : -1;
    blocks.splice(idx >= 0 ? idx + 1 : blocks.length, 0, block);
    // keep a text block after images so typing can continue
    if (block.type === 'image') blocks.splice(blocks.indexOf(block) + 1, 0, { id: uid(), type: 'text', text: '' });
    update({ blocks });
    if (block.type !== 'image') setFocusId(block.id);
  };
  const removeBlock = (id) => {
    const b = latest.current.blocks.find((x) => x.id === id);
    let blocks = latest.current.blocks.filter((x) => x.id !== id);
    if (!blocks.length) blocks = [{ id: uid(), type: 'text', text: '' }];
    update({ blocks });
    if (b?.type === 'image') deleteImage(b.imageId);
  };

  const addImage = async (camera) => {
    tap();
    try {
      const img = await pickImage(camera);
      if (img) insertBlock({ id: uid(), type: 'image', ...img });
    } catch (e) {
      Alert.alert('Could not add image', e?.message || '');
    }
  };

  const del = () =>
    Alert.alert('Delete note?', note.title || 'Untitled', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletedRef.current = true;
          if (useStore.getState().notes.some((x) => x.id === note.id)) remove('notes', note.id);
          nav.goBack();
        },
      },
    ]);

  const s = note.subjectId ? subjectOf(subjects, note.subjectId) : null;
  const bg = NOTE_COLORS[note.color || 'none']?.[c.dark ? 'dark' : 'light'] || c.bg;
  const words = note.blocks.reduce((a, b) => a + ((b.text || '').trim() ? b.text.trim().split(/\s+/).length : 0), 0);

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ paddingTop: insets.top + 6, paddingHorizontal: 20 }}>
        <Row between>
          <IconBtn name="back" onPress={() => nav.goBack()} />
          <Row gap={8}>
            <Chip label={s ? `${s.emoji} ${s.name}` : '＋ Subject'} dot={s?.color} small onPress={() => setShowSubjects(!showSubjects)} />
            <IconBtn name="pin" onPress={() => update({ pinned: !note.pinned })} color={note.pinned ? c.p : c.text} bg={note.pinned ? c.soft : undefined} />
            <IconBtn name="trash" onPress={del} color={c.danger} />
          </Row>
        </Row>
        {showSubjects && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 4 }}>
            <Chip small label="None" on={!note.subjectId} onPress={() => (update({ subjectId: null }), setShowSubjects(false))} />
            {live(subjects).map((x) => (
              <Chip key={x.id} small label={x.name} dot={x.color} color={x.color} on={note.subjectId === x.id} onPress={() => (update({ subjectId: x.id }), setShowSubjects(false))} />
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <TextInput
          value={note.title}
          onChangeText={(t) => update({ title: t })}
          placeholder="Title"
          placeholderTextColor={c.muted}
          multiline
          style={{ fontFamily: FONTS[700], fontSize: 26, color: c.text, padding: 0 }}
        />
        <T size={11} muted style={{ marginTop: 2, marginBottom: 10 }}>
          {note.isNew ? 'New note' : `Edited ${relTime(note.updatedAt)}`} · {words} words
        </T>

        {note.blocks.map((b, i) => {
          if (b.type === 'image')
            return (
              <Pressable
                key={b.id}
                onLongPress={() =>
                  Alert.alert('Remove image?', '', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => removeBlock(b.id) },
                  ])
                }
                style={{ marginVertical: 8 }}
              >
                <Image
                  source={{ uri: imageUri(b.imageId) }}
                  style={{ width: W, height: Math.min(W * ((b.h || 3) / (b.w || 4)), 520), borderRadius: 18, backgroundColor: c.soft }}
                  resizeMode="cover"
                />
              </Pressable>
            );
          if (b.type === 'check')
            return (
              <Row key={b.id} gap={10} style={{ alignItems: 'flex-start', paddingVertical: 4 }}>
                <View style={{ paddingTop: 6 }}>
                  <CheckBox size={22} done={b.done} onPress={() => setBlock(b.id, { done: !b.done })} />
                </View>
                <TextInput
                  value={b.text}
                  autoFocus={focusId === b.id}
                  onFocus={() => setFocusId(b.id)}
                  onChangeText={(t) => setBlock(b.id, { text: t })}
                  placeholder="To-do item"
                  placeholderTextColor={c.muted}
                  multiline
                  onKeyPress={(e) => e.nativeEvent.key === 'Backspace' && !b.text && removeBlock(b.id)}
                  style={{
                    flex: 1,
                    fontFamily: FONTS[500],
                    fontSize: 15,
                    color: b.done ? c.muted : c.text,
                    textDecorationLine: b.done ? 'line-through' : 'none',
                    paddingVertical: 6,
                  }}
                />
              </Row>
            );
          return (
            <TextInput
              key={b.id}
              value={b.text}
              autoFocus={focusId === b.id || (note.isNew && i === 0 && !note.title)}
              onFocus={() => setFocusId(b.id)}
              onChangeText={(t) => setBlock(b.id, { text: t })}
              placeholder={i === 0 ? 'Start writing… formulas, summaries, ideas' : ''}
              placeholderTextColor={c.muted}
              multiline
              onKeyPress={(e) => e.nativeEvent.key === 'Backspace' && !b.text && note.blocks.length > 1 && removeBlock(b.id)}
              style={{ fontFamily: FONTS[500], fontSize: 15, color: c.text, lineHeight: 24, paddingVertical: 4, textAlignVertical: 'top' }}
            />
          );
        })}
      </ScrollView>

      {showColors && (
        <Row gap={10} style={{ justifyContent: 'center', paddingVertical: 8 }}>
          {Object.entries(NOTE_COLORS).map(([k, v]) => (
            <Pressable
              key={k}
              onPress={() => update({ color: k })}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: v[c.dark ? 'dark' : 'light'] || c.card,
                borderWidth: (note.color || 'none') === k ? 3 : 1,
                borderColor: (note.color || 'none') === k ? c.p : c.line,
              }}
            />
          ))}
        </Row>
      )}
      <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 10, paddingTop: 6 }}>
        <View style={[{ backgroundColor: c.card, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', height: 56 }, shadow(c, true)]}>
          <Pressable hitSlop={8} onPress={() => (tap(), insertBlock({ id: uid(), type: 'text', text: '' }))}>
            <Icon name="text" size={22} color={c.text} />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => (tap(), insertBlock({ id: uid(), type: 'check', text: '', done: false }))}>
            <Icon name="checkSq" size={22} color={c.text} />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => addImage(false)} style={{ backgroundColor: c.soft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="image" size={20} color={c.p} />
            <T w={600} size={12} color={c.p}>
              Image
            </T>
          </Pressable>
          <Pressable hitSlop={8} onPress={() => addImage(true)}>
            <Icon name="camera" size={22} color={c.text} />
          </Pressable>
          <Pressable hitSlop={8} onPress={() => (tap(), setShowColors(!showColors))}>
            <Icon name="palette" size={22} color={showColors ? c.p : c.text} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
