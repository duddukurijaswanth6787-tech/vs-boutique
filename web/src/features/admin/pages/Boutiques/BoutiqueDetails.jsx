import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    getBoutiqueDetails, updateOwnerPermissions, updateOwnerStatus, 
    updateBoutique, getUnassignedOwners, inviteOwner, linkOwner, 
    unlinkOwner, resendInvite, sendPasswordResetLink, deleteBoutique 
} from '@core/services';
import { 
    ArrowLeft, Store, User, Shield, AlertTriangle, Edit3, 
    Loader2 
} from 'lucide-react';
import BoutiqueEditModal from '@core/components/shared/BoutiqueEditModal';
import BoutiqueProfileTab from '@core/components/boutique/BoutiqueProfileTab';
import OwnerDetailsTab from '@core/components/boutique/OwnerDetailsTab';
import AccessControlTab from '@core/components/boutique/AccessControlTab';
import DangerZoneTab from '@core/components/boutique/DangerZoneTab';

const BoutiqueDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [boutique, setBoutique] = useState(null);
    const [owners, setOwners] = useState([]);
    const [owner,  setOwner]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('boutique');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    
    // Add-owner panel state
    const [unassignedOwners, setUnassignedOwners] = useState([]);
    const [ownerMode, setOwnerMode] = useState(null);
    const [selectedOwnerId, setSelectedOwnerId] = useState('');
    const [inviteData, setInviteData] = useState({ ownerName: '', email: '', username: '', mobileNumber: '' });
    const [submittingOwner, setSubmittingOwner] = useState(false);

    // Per-owner pending permissions
    const [pendingPermissions, setPendingPermissions] = useState({});
    const [savingPermissions, setSavingPermissions] = useState({});

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const data = await getBoutiqueDetails(id);
            setBoutique(data.boutique);
            const allOwners = data.owners || (data.owner ? [data.owner] : []);
            setOwners(allOwners);
            setOwner(allOwners[0] || null);

            const permMap = {};
            allOwners.forEach(o => { permMap[o._id] = { ...o.permissions }; });
            setPendingPermissions(permMap);

            if (allOwners.length < 2) {
                const unassigned = await getUnassignedOwners();
                setUnassignedOwners(unassigned);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch boutique details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetails(); }, [id]);

    const handleOwnerStatusToggle = async (targetOwner) => {
        try {
            const newStatus = targetOwner.status === 'Active' ? 'Inactive' : 'Active';
            await updateOwnerStatus(targetOwner._id, newStatus);
            setOwners(prev => prev.map(o => o._id === targetOwner._id ? { ...o, status: newStatus } : o));
            if (owner?._id === targetOwner._id) setOwner({ ...owner, status: newStatus });
        } catch (err) { alert('Failed to update owner status'); }
    };

    const handleBoutiqueStatusToggle = async () => {
        try {
            const newStatus = boutique.status === 'Active' ? 'Inactive' : 'Active';
            await updateBoutique(id, { status: newStatus });
            setBoutique({ ...boutique, status: newStatus });
        } catch (err) { alert('Failed to update boutique status'); }
    };

    const handleToggleVerified = async () => {
        try {
            const newVerified = !boutique.verified;
            await updateBoutique(id, { verified: newVerified });
            setBoutique({ ...boutique, verified: newVerified });
        } catch (err) { alert('Failed to update verification status'); }
    };

    const handleToggleFeatured = async () => {
        try {
            const newFeatured = !boutique.featuredBoutique;
            await updateBoutique(id, { featuredBoutique: newFeatured });
            setBoutique({ ...boutique, featuredBoutique: newFeatured });
        } catch (err) { alert('Failed to update featured status'); }
    };

    const handlePayoutStatusChange = async (newStatus) => {
        try {
            await updateBoutique(id, { payoutStatus: newStatus });
            setBoutique({ ...boutique, payoutStatus: newStatus });
        } catch (err) { alert('Failed to update payout status'); }
    };

    const handleUpdateBoutique = async (updatedData) => {
        const data = await updateBoutique(id, updatedData);
        setBoutique(data);
        alert('Boutique profile updated successfully');
    };

    const handleLinkOwner = async () => {
        if (!selectedOwnerId) return alert('Please select an owner');
        setSubmittingOwner(true);
        try {
            await linkOwner({ boutiqueId: id, ownerId: selectedOwnerId });
            alert('Owner linked successfully');
            setOwnerMode(null);
            setSelectedOwnerId('');
            fetchDetails();
        } catch (err) { alert(err.response?.data?.message || 'Failed to link owner'); }
        finally { setSubmittingOwner(false); }
    };

    const handleInviteOwner = async (e) => {
        e.preventDefault();
        setSubmittingOwner(true);
        try {
            await inviteOwner({ ...inviteData, boutiqueId: id });
            alert('Invitation sent and owner linked successfully');
            setOwnerMode(null);
            setInviteData({ ownerName: '', email: '', username: '', mobileNumber: '' });
            fetchDetails();
        } catch (err) { alert(err.response?.data?.message || 'Failed to invite owner'); }
        finally { setSubmittingOwner(false); }
    };

    const handleUnlinkOwner = async (targetOwner) => {
        if (!window.confirm(`Are you sure you want to unlink ${targetOwner.ownerName}?`)) return;
        try {
            await unlinkOwner({ boutiqueId: id, ownerId: targetOwner._id });
            alert('Owner unlinked successfully');
            fetchDetails();
        } catch (err) { alert('Failed to unlink owner'); }
    };

    const handleResendInvite = async (targetOwner) => {
        try {
            await resendInvite(targetOwner._id);
            alert('Invitation email resent successfully');
        } catch (err) { alert('Failed to resend invitation'); }
    };

    const handlePermissionToggle = (ownerId, permKey) => {
        setPendingPermissions(prev => ({
            ...prev,
            [ownerId]: { ...prev[ownerId], [permKey]: !prev[ownerId]?.[permKey] }
        }));
    };

    const handleSavePermissions = async (targetOwner) => {
        setSavingPermissions(prev => ({ ...prev, [targetOwner._id]: true }));
        try {
            const perms = pendingPermissions[targetOwner._id];
            await updateOwnerPermissions(targetOwner._id, perms);
            setOwners(prev => prev.map(o => o._id === targetOwner._id ? { ...o, permissions: perms } : o));
            alert(`Permissions saved for ${targetOwner.ownerName}`);
        } catch (err) {
            alert('Failed to save permissions.');
            setPendingPermissions(prev => ({ ...prev, [targetOwner._id]: { ...targetOwner.permissions } }));
        } finally { setSavingPermissions(prev => ({ ...prev, [targetOwner._id]: false })); }
    };

    const handleSendResetLink = async (targetOwner) => {
        if (!window.confirm(`Send reset link to ${targetOwner.email}?`)) return;
        try {
            await sendPasswordResetLink(targetOwner._id);
            alert('Reset link sent successfully.');
        } catch (err) { alert('Failed to send reset link.'); }
    };

    const handleSoftDeleteBoutique = async () => {
        const adminPassword = prompt('Enter admin password to delete this boutique:');
        if (!adminPassword) return;
        try {
            await deleteBoutique(id, adminPassword);
            alert('Boutique deleted successfully');
            navigate('/boutiques');
        } catch (err) { alert(err.response?.data?.message || 'Failed to delete boutique'); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!boutique) return <div className="p-8 text-center text-gray-500">Boutique not found</div>;

    const ImageModal = ({ src, onClose }) => (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={onClose}>
            <img src={src} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-2xl" />
            <button onClick={onClose} className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft size={32} />
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            {previewImage && <ImageModal src={previewImage} onClose={() => setPreviewImage(null)} />}
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                    <button onClick={() => navigate('/boutiques')} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{boutique.name}</h1>
                        <p className="text-xs md:text-sm text-gray-500">Managed by {owner ? owner.ownerName : 'Unknown'}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => setIsEditModalOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                        <Edit3 size={16} /> <span className="hidden sm:inline">Edit Profile</span>
                    </button>
                    <button onClick={handleBoutiqueStatusToggle} className={`px-4 py-2 rounded-lg font-bold border text-sm ${boutique.status === 'Active' ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                        {boutique.status}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto no-scrollbar -mx-4 md:mx-0">
                <div className="flex border-b border-gray-200 min-w-max px-4 md:px-0">
                    {[
                        { id: 'boutique', label: 'Boutique Profile', icon: Store },
                        { id: 'owner', label: 'Owner Details', icon: User },
                        { id: 'access', label: 'Access Control', icon: Shield },
                        { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-6 font-medium text-sm flex items-center space-x-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                            <tab.icon size={16} /> <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                {activeTab === 'boutique' && <BoutiqueProfileTab boutique={boutique} setPreviewImage={setPreviewImage} handleToggleVerified={handleToggleVerified} handleToggleFeatured={handleToggleFeatured} handlePayoutStatusChange={handlePayoutStatusChange} />}
                {activeTab === 'owner' && <OwnerDetailsTab owners={owners} ownerMode={ownerMode} setOwnerMode={setOwnerMode} handleSendResetLink={handleSendResetLink} handleResendInvite={handleResendInvite} handleOwnerStatusToggle={handleOwnerStatusToggle} handleUnlinkOwner={handleUnlinkOwner} unassignedOwners={unassignedOwners} selectedOwnerId={selectedOwnerId} setSelectedOwnerId={setSelectedOwnerId} handleLinkOwner={handleLinkOwner} inviteData={inviteData} setInviteData={setInviteData} handleInviteOwner={handleInviteOwner} submittingOwner={submittingOwner} />}
                {activeTab === 'access' && <AccessControlTab owners={owners} pendingPermissions={pendingPermissions} handlePermissionToggle={handlePermissionToggle} handleSavePermissions={handleSavePermissions} savingPermissions={savingPermissions} />}
                {activeTab === 'danger' && <DangerZoneTab handleSoftDeleteBoutique={handleSoftDeleteBoutique} />}
            </div>

            {isEditModalOpen && <BoutiqueEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} boutique={boutique} onUpdate={handleUpdateBoutique} />}
        </div>
    );
};

export default BoutiqueDetails;
