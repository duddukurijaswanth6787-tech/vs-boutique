import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBoutiques, addBoutique, updateBoutique, deleteBoutique } from '@core/services';
import BoutiqueForm from '@core/components/shared/BoutiqueForm';
import BoutiqueTable from '@core/components/shared/BoutiqueTable';
import EditModal from '@core/components/shared/EditModal';
import DeleteConfirm from '@core/components/shared/DeleteConfirm';
import { TableSkeleton } from '@core/components/ui/Skeleton';
import { Plus, X, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import useDebounce from '@core/hooks/useDebounce';

const Boutiques = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Edit/Delete State
  const [selectedBoutique, setSelectedBoutique] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // 📡 FETCH BOUTIQUES
  const { data: boutiques = [], isLoading } = useQuery({
    queryKey: ['boutiques'],
    queryFn: getBoutiques,
  });

  // 📝 MUTATION: ADD
  const addMutation = useMutation({
    mutationFn: addBoutique,
    onSuccess: () => {
      queryClient.invalidateQueries(['boutiques']);
      setShowForm(false);
    },
  });

  // 📝 MUTATION: UPDATE (Optimistic)
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateBoutique(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(['boutiques']);
      const previousBoutiques = queryClient.getQueryData(['boutiques']);
      queryClient.setQueryData(['boutiques'], (old) =>
        old.map((b) => (b.id === id ? { ...b, ...data } : b))
      );
      return { previousBoutiques };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['boutiques'], context.previousBoutiques);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['boutiques']);
    },
  });

  // 📝 MUTATION: DELETE (Optimistic)
  const deleteMutation = useMutation({
    mutationFn: ({ id, adminPassword }) => deleteBoutique(id, adminPassword),
    onMutate: async (id) => {
      await queryClient.cancelQueries(['boutiques']);
      const previousBoutiques = queryClient.getQueryData(['boutiques']);
      queryClient.setQueryData(['boutiques'], (old) => old.filter((b) => b.id !== id));
      return { previousBoutiques };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(['boutiques'], context.previousBoutiques);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['boutiques']);
      setIsDeleteModalOpen(false);
    },
  });

  const handleEditClick = useCallback((boutique) => {
    setSelectedBoutique(boutique);
    setIsEditModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((id) => {
    setSelectedBoutique(boutiques.find(b => b.id === id));
    setAdminPassword('');
    setDeleteError('');
    setIsDeleteModalOpen(true);
  }, [boutiques]);

  const handleUpdate = async (id, data) => {
    updateMutation.mutate({ id, data });
  };

  const handleConfirmDelete = async () => {
    if (!adminPassword) {
      setDeleteError('Please enter admin password.');
      return;
    }

    setDeleteError('');
    deleteMutation.mutate(
      { id: selectedBoutique.id, adminPassword },
      {
        onError: (err) => {
          setDeleteError(err?.response?.data?.message || 'Failed to delete boutique');
        }
      }
    );
  };

  // 🔍 Filtered Data (Memoized)
  const filteredBoutiques = useMemo(() => {
    return boutiques.filter(b => 
      b.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.city?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      b.area?.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [boutiques, debouncedSearch]);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search stores instantly..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-[1.5rem] shadow-card focus:ring-2 focus:ring-primary/10 outline-none transition-all font-semibold"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center justify-center px-8 py-4 rounded-[1.5rem] font-black transition-all shadow-lg ${
            showForm 
              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' 
              : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
          }`}
        >
          {showForm ? <><X size={20} className="mr-2" /> Close Form</> : <><Plus size={20} className="mr-2" /> Add Boutique</>}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <BoutiqueForm onBoutiqueAdded={(data) => addMutation.mutateAsync(data)} />
        </motion.div>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <BoutiqueTable 
          boutiques={filteredBoutiques} 
          onDelete={handleDeleteClick} 
          onEdit={handleEditClick} 
        />
      )}

      {/* Modals */}
      <EditModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        boutique={selectedBoutique}
        onUpdate={handleUpdate}
      />

      <DeleteConfirm 
        isOpen={isDeleteModalOpen} 
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAdminPassword('');
          setDeleteError('');
        }} 
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isLoading}
        password={adminPassword}
        onPasswordChange={setAdminPassword}
        errorMessage={deleteError}
      />
    </div>
  );
};

export default Boutiques;
