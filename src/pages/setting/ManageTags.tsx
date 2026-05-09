import React, {useEffect, useState} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {Button, Dialog, IconButton, Portal, Text, TextInput, useTheme} from 'react-native-paper';
import {useSelector} from 'react-redux';
import {ExpenseAPI} from '../../api/ExpenseAPI';
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

      <Portal>
        <Dialog visible={openDialog} onDismiss={() => setOpenDialog(false)}>
          <Dialog.Title>Add New Tag</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Tag Name" value={newTagName} onChangeText={setNewTagName} mode="outlined" autoFocus />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpenDialog(false)}>Cancel</Button>
            <Button onPress={handleAddTag} disabled={!newTagName.trim()}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteConfirmDialog} onDismiss={() => setDeleteConfirmDialog(false)}>
          <Dialog.Title>Delete Tag</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete "{tagToDelete}"?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirmDialog(false)}>Cancel</Button>
            <Button textColor={theme.colors.error} onPress={confirmDeleteTag}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
