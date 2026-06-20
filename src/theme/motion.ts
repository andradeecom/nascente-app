export const motion = {
  durations: {
    screenPush: 300,
    bottomSheet: 250,
    readerChrome: 200,
    verseHighlight: 150,
    snackbar: 300,
    toast: 200,
  },
  easings: {
    screenPush: 'default',
    bottomSheet: 'ease-out',
    readerChrome: 'ease-in-out',
    verseHighlight: 'ease-out',
    snackbar: 'ease-out',
    toast: 'linear',
  },
} as const;
