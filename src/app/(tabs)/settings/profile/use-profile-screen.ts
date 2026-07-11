import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/stores/auth';
import { useLogout, useUpdateProfile } from '@/hooks/use-auth';
import { uploadAvatar } from '@/lib/avatar-storage';
import { createProfileSchema, type ProfileFormData } from '@/schemas/profile';
import { translate } from '@/i18n';

/**
 * Screen-private logic for the profile screen. Owns the view/edit mode switch, the
 * name form (RHF + zod), and the editable photo (pick locally → preview → upload on
 * save). Email is display-only (changing it needs a re-confirmation flow, out of
 * scope). The upload happens on save (not on pick) so cancelling edit costs no
 * network + leaves no orphaned storage object.
 */
export default function useProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  // A locally-picked, not-yet-uploaded avatar URI (shown as an immediate preview).
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);

  const schema = useMemo(() => createProfileSchema(), []);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: standardSchemaResolver(schema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' },
  });

  // Keep the form seeded from the current user whenever it changes (e.g. after a
  // successful save pushes the refreshed user into the store) and we're not mid-edit.
  useEffect(() => {
    if (!isEditing) {
      reset({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' });
    }
  }, [user?.firstName, user?.lastName, isEditing, reset]);

  const enterEditMode = () => setIsEditing(true);

  const cancelEdit = () => {
    setPendingPhotoUri(null);
    reset({ firstName: user?.firstName ?? '', lastName: user?.lastName ?? '' });
    setIsEditing(false);
  };

  const handleToggleMode = (nextEditing: boolean) => {
    if (nextEditing) enterEditMode();
    else cancelEdit();
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({ type: 'error', text1: translate('profile.photoPermissionDenied') });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      // iOS delivers HEIC by default. `Compatible` makes the picker transcode to a
      // widely-supported representation (JPEG) at pick time, so HEIC bytes never reach
      // the uploader — our `avatars` bucket only allows jpeg/png/webp, and browsers /
      // expo-image on Android can't render HEIC anyway. (`allowsEditing` already
      // re-encodes to JPEG; this covers the paths where the original would pass through.)
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;

    setPendingPhotoUri(result.assets[0].uri);
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    try {
      let profileImageUrl = user.profileImageUrl ?? null;
      if (pendingPhotoUri) {
        profileImageUrl = await uploadAvatar(pendingPhotoUri);
      }

      await updateProfile.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        profileImageUrl,
      });

      setPendingPhotoUri(null);
      setIsEditing(false);
      Toast.show({ type: 'success', text1: translate('profile.savedTitle') });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: translate('profile.saveFailed'),
        text2: error instanceof Error ? error.message : translate('errors.generic'),
      });
    }
  };

  const handleSave = () => handleSubmit(onSubmit)();

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Guest';
  // The avatar shows the pending local preview while editing, else the saved photo.
  const avatarUri = pendingPhotoUri ?? user?.profileImageUrl ?? undefined;

  return {
    user,
    fullName,
    avatarUri,
    isEditing,
    control,
    errors,
    isSaving: updateProfile.isPending,
    handleToggleMode,
    handlePickPhoto,
    handleSave,
    logout,
  };
}
