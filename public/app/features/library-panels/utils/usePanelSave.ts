import { useEffect } from 'react';
import useAsyncFn from 'react-use/lib/useAsyncFn';
import { AppEvents } from '@grafana/data';
import appEvents from 'app/core/app_events';
import { PanelModel } from 'app/features/dashboard/state';
import { getLibrarySrv } from 'app/core/services/library_srv';

const saveLibraryPanels = (panel: any, folderId: number) => {
  if (!panel.libraryPanel) {
    return Promise.reject();
  }

  if (panel.libraryPanel && panel.libraryPanel.uid === undefined) {
    panel.libraryPanel.name = panel.title;
    return getLibrarySrv().addLibraryPanel(panel, folderId!);
  }

  return getLibrarySrv().updateLibraryPanel(panel, folderId!);
};

export const usePanelSave = () => {
  const [state, saveLibraryPanel] = useAsyncFn(async (panel: PanelModel, folderId: number) => {
    let panelSaveModel = panel.getSaveModel();
    panelSaveModel = {
      libraryPanel: {
        name: panel.title,
        uid: undefined,
      },
      ...panelSaveModel,
    };
    const savedPanel = await saveLibraryPanels(panelSaveModel, folderId);
    panel.restoreModel({
      ...savedPanel.model,
      libraryPanel: {
        uid: savedPanel.uid,
        name: savedPanel.name,
        lastEdited: savedPanel.meta.updated,
        lastAuthor: savedPanel.meta.updatedBy.name,
        avatarUrl: savedPanel.meta.updatedBy.avatarUrl,
      },
    });
    panel.refresh();
    return savedPanel;
  }, []);

  useEffect(() => {
    if (state.error) {
      appEvents.emit(AppEvents.alertError, [`Error saving library panel: "${state.error.message}"`]);
    }
    if (state.value) {
      appEvents.emit(AppEvents.alertSuccess, ['Library panel saved']);
    }
  }, [state]);

  return { state, saveLibraryPanel };
};