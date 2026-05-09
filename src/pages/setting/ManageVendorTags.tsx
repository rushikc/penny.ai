import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, FlatList, ActivityIndicator} from 'react-native';
import {Button, Chip, Dialog, IconButton, Portal, Searchbar, Text, useTheme} from 'react-native-paper';
import {VendorTag} from '../../Types';
import {ExpenseAPI} from '../../api/ExpenseAPI';

const ManageVendorTags: React.FC = () => {
  const theme = useTheme();
  const [vendorTags, setVendorTags] = useState<VendorTag[]>([]);
  const [filteredVendorTags, setFilteredVendorTags] = useState<VendorTag[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVendorTag, setSelectedVendorTag] = useState<VendorTag | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    loadVendorTags();
    ExpenseAPI.getTagList().then(setAvailableTags).catch(console.error);
  }, []);

  const loadVendorTags = () => {
    setLoading(true);
    ExpenseAPI.getVendorTagList().then(maps => { setVendorTags(maps); setFilteredVendorTags(maps); })
      .catch(console.error).finally(() => setLoading(false));
  };

  const filterVendorTags = useCallback(() => {
    if (!searchTerm.trim()) { setFilteredVendorTags(vendorTags); return; }
    const term = searchTerm.toLowerCase();
    setFilteredVendorTags(vendorTags.filter(vt => vt.vendor.toLowerCase().includes(term) || vt.tag.toLowerCase().includes(term)));
  }, [searchTerm, vendorTags]);

  useEffect(() => { filterVendorTags(); }, [searchTerm, vendorTags, filterVendorTags]);

  const handleEditClick = (vt: VendorTag) => { setSelectedVendorTag(vt); setSelectedTag(vt.tag); setEditDialogOpen(true); };

  const handleDeleteClick = (id: string) => {
    ExpenseAPI.deleteVendorTag(id).then(result => {
      if (result) { setVendorTags(prev => prev.filter(t => t.id !== id)); }
    });
  };

  const handleSaveEdit = () => {
    if (!selectedVendorTag) return;
    const updated = {...selectedVendorTag, tag: selectedTag, date: Date.now()};
    ExpenseAPI.updateVendorTag(updated).then(result => {
      if (result) { setVendorTags(prev => prev.map(t => t.id === updated.id ? updated : t)); }
    }).finally(() => setEditDialogOpen(false));
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Searchbar placeholder="Search by vendor or tag" value={searchTerm} onChangeText={setSearchTerm}
        style={[styles.searchbar, {backgroundColor: theme.colors.surfaceVariant}]} />

      {loading ? (
        <ActivityIndicator size="large" style={{marginTop: 40}} color={theme.colors.primary} />
      ) : filteredVendorTags.length === 0 ? (
        <Text style={[styles.emptyText, {color: theme.colors.outline}]}>No vendor-tag mappings found.</Text>
      ) : (
        <FlatList
          data={filteredVendorTags}
          keyExtractor={item => item.id}
          renderItem={({item}) => (
            <View style={[styles.listItem, {borderBottomColor: theme.colors.outlineVariant}]}>
              <View style={{flex: 1}} onTouchEnd={() => handleEditClick(item)}>
                <Text variant="bodyMedium" numberOfLines={1} style={{color: theme.colors.onSurface}}>
                  {item.vendor.toLowerCase().substring(0, 25)}
                </Text>
                <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant}}>Tag: {item.tag}</Text>
              </View>
              <IconButton icon="minus-circle-outline" iconColor={theme.colors.error} size={20}
                onPress={() => handleDeleteClick(item.id)} />
            </View>
          )}
        />
      )}

      <Portal>
        <Dialog visible={editDialogOpen} onDismiss={() => setEditDialogOpen(false)}>
          <Dialog.Title>Edit Vendor Tag</Dialog.Title>
          <Dialog.Content>
            {selectedVendorTag && (
              <>
                <Text variant="bodyLarge" style={{marginBottom: 12}}>{selectedVendorTag.vendor.toLowerCase()}</Text>
                <Text variant="titleSmall" style={{marginBottom: 8}}>Select a category</Text>
                <View style={styles.chipGrid}>
                  {availableTags.map(tag => (
                    <Chip key={tag} selected={selectedTag === tag} onPress={() => setSelectedTag(tag)}>{tag}</Chip>
                  ))}
                </View>
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button mode="contained" onPress={handleSaveEdit} disabled={!selectedTag}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  searchbar: {marginBottom: 12},
  emptyText: {textAlign: 'center', marginTop: 40},
  listItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1},
  chipGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
});

export default ManageVendorTags;
