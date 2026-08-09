import React, {useEffect, useState} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {Button, IconButton, Text, TextInput, useTheme} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import {addTag, deleteTag, selectExpense, setTagList} from '../../store/expenseActions';

const ManageTags: React.FC = () => {
  const theme = useTheme();
  const {tagList} = useSelector(selectExpense);
  const [newTagName, setNewTagName] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [tagToDelete, setTagToDelete] = useState('');

  useEffect(() => {
    ExpenseAPI.getTagList().then((tags: string[]) => setTagList(tags));
  }, []);

  const handleDeleteTag = (tag: string) => { setTagToDelete(tag); setDeleteConfirmDialog(true); };

  const confirmDeleteTag = () => {
    deleteTag(tagToDelete);
    void ExpenseAPI.updateTagList(tagList.filter(t => t !== tagToDelete));
    setDeleteConfirmDialog(false);
  };

  const handleAddTag = () => {
    if (newTagName && !tagList.includes(newTagName)) {
      addTag(newTagName);
      void ExpenseAPI.updateTagList([...tagList, newTagName]);
      setOpenDialog(false);
      setNewTagName('');
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text variant="bodyMedium" style={[styles.subtitle, {color: theme.colors.onSurfaceVariant}]}>
        Add, Remove, and Reorder Your Tags
      </Text>

      <FlatList
        data={tagList}
        keyExtractor={(item) => item}
        renderItem={({item}) => (
          <View style={[styles.tagItem, {borderBottomColor: theme.colors.outlineVariant}]}>
            <Text variant="bodyLarge" style={{flex: 1, color: theme.colors.onSurface}}>{item}</Text>
            <IconButton icon="minus-circle-outline" iconColor={theme.colors.error} size={22}
              onPress={() => handleDeleteTag(item)} />
          </View>
        )}
        contentContainerStyle={{paddingBottom: 80}}
      />

      <Button mode="contained" icon="plus" onPress={() => setOpenDialog(true)} style={styles.addButton}>
        Add New Tag
      </Button>

      <BottomSheetModal
        visible={openDialog}
        onDismiss={() => setOpenDialog(false)}
        title="Add New Tag"
        primaryLabel="Add"
        onPrimary={handleAddTag}
        primaryDisabled={!newTagName.trim()}
        scrollable={false}
      >
        <TextInput label="Tag Name" value={newTagName} onChangeText={setNewTagName} mode="outlined" autoFocus />
      </BottomSheetModal>

      <BottomSheetModal
        visible={deleteConfirmDialog}
        onDismiss={() => setDeleteConfirmDialog(false)}
        title="Delete Tag"
        primaryLabel="Delete"
        onPrimary={confirmDeleteTag}
        primaryTone="danger"
        scrollable={false}
      >
        <Text>Are you sure you want to delete &quot;{tagToDelete}&quot;?</Text>
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  subtitle: {textAlign: 'center', marginBottom: 16},
  tagItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1},
  addButton: {margin: 16},
});

export default ManageTags;
