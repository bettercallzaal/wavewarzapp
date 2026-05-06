import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_UID = 'wwapp.demo.uid';
const KEY_NICK = 'wwapp.demo.nickname';

const randomId = (): string => Math.random().toString(36).slice(2, 10);

export const loadIdentity = async (): Promise<{ uid: string; nickname: string | null }> => {
  let uid = await AsyncStorage.getItem(KEY_UID);
  if (!uid) {
    uid = `demo-${randomId()}`;
    await AsyncStorage.setItem(KEY_UID, uid);
  }
  const nickname = await AsyncStorage.getItem(KEY_NICK);
  return { uid, nickname };
};

export const saveNickname = async (nickname: string): Promise<void> => {
  await AsyncStorage.setItem(KEY_NICK, nickname.trim());
};
