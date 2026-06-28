import React from 'react';
import { Store, MapPin, Clock, Briefcase, Image as ImageIcon, IndianRupee, ExternalLink, Truck, User, CheckCircle, XCircle, Shield } from 'lucide-react';

const safeUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    try {
        const parsed = new URL(url);
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? url : null;
    } catch {
        return null;
    }
};

const DetailCard = ({ title, icon: Icon, children, className = "" }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6 pb-3 border-b border-gray-50">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Icon size={18} />
            </div>
            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">{title}</h4>
        </div>
        {children}
    </div>
);

const InfoRow = ({ label, value, icon: Icon, isLink = false }) => (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0 group">
        <dt className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
            {Icon && <Icon size={12} className="mr-2" />} {label}
        </dt>
        <dd className="text-sm font-bold text-gray-900 text-right max-w-[60%] truncate">
            {isLink && value ? (
                <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center justify-end">
                    View <IndianRupee size={12} className="ml-1" />
                </a>
            ) : (value || 'N/A')}
        </dd>
    </div>
);

const BoutiqueProfileTab = ({ boutique, setPreviewImage, handleToggleVerified, handleToggleFeatured, handlePayoutStatusChange }) => {
    const displayLogo = safeUrl(boutique.media?.logo);
    const displayCover = safeUrl(boutique.media?.coverImage);
    const displayGallery = (() => {
        const g = boutique.media?.gallery;
        if (Array.isArray(g) && g.length) return g.filter((u) => safeUrl(u));
        return [];
    })();

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="relative rounded-[2rem] overflow-hidden bg-gray-100 border border-gray-100 shadow-sm">
                <div className="h-48 w-full bg-cover bg-center bg-gray-200" style={{ backgroundImage: displayCover ? `url(${displayCover})` : 'none' }}>
                    {!displayCover && <div className="w-full h-full flex items-center justify-center text-gray-300"><Store size={48} /></div>}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="relative p-8 -mt-20 flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
                    <div className="flex items-center space-x-6">
                        {displayLogo ? (
                            <img 
                                src={displayLogo} 
                                alt="Logo" 
                                className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white shadow-xl bg-white cursor-zoom-in"
                                onClick={() => setPreviewImage(displayLogo)}
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-[2.5rem] border-4 border-white shadow-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-black uppercase tracking-widest text-center px-2">
                                No logo
                            </div>
                        )}
                        <div className="text-white pb-2">
                            <div className="flex items-center space-x-3 mb-1">
                                <h2 className="text-3xl font-black tracking-tight">{boutique.name}</h2>
                                {boutique.featuredBoutique && <span className="px-3 py-1 bg-amber-400 text-amber-900 text-[10px] font-black uppercase rounded-full shadow-lg">Featured</span>}
                            </div>
                            <p className="flex items-center text-white/80 font-bold text-sm">
                                <MapPin size={14} className="mr-2" /> {boutique.city}, {boutique.state} • {boutique.experienceYears} Years Exp
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3 pb-2">
                        <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg ${boutique.status === 'Active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                            {boutique.status}
                        </span>
                        <span className="px-5 py-2 bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg flex items-center">
                            <Shield size={14} className="mr-2" /> Verified
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <DetailCard title="Basic Information" icon={Store}>
                    <div className="space-y-4">
                        <div>
                            <dt className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</dt>
                            <dd className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50/50 p-6 rounded-3xl border border-gray-100/50 whitespace-pre-line italic">
                                {boutique.description || 'No description provided.'}
                            </dd>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Starting Price</dt>
                                <dd className="text-lg font-black text-primary flex items-center"><IndianRupee size={16} /> {boutique.startingPrice || '0'}</dd>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <dt className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Experience</dt>
                                <dd className="text-lg font-black text-gray-900">{boutique.experienceYears} Years</dd>
                            </div>
                        </div>
                        <div>
                            <dt className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Work Specialities</dt>
                            <div className="flex flex-wrap gap-2">
                                {boutique.workTypeSpecialty?.map((s, i) => <span key={i} className="px-4 py-2 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl border border-primary/10">{s}</span>)}
                                {(!boutique.workTypeSpecialty || boutique.workTypeSpecialty.length === 0) && <span className="text-gray-400 text-xs italic">No specialties listed</span>}
                            </div>
                        </div>
                    </div>
                </DetailCard>

                {/* Location & Contact */}
                <DetailCard title="Location & Contact" icon={MapPin}>
                    <div className="space-y-1">
                        <InfoRow label="Mobile" value={boutique.mobileNumber} icon={IndianRupee} />
                        <InfoRow label="WhatsApp" value={boutique.whatsappNumber} icon={IndianRupee} />
                        <InfoRow label="Email" value={boutique.email} icon={IndianRupee} />
                        <InfoRow label="City" value={`${boutique.city}, ${boutique.state}`} icon={IndianRupee} />
                        <InfoRow label="Pincode" value={boutique.pincode} icon={IndianRupee} />
                        <InfoRow label="Radius" value={`${boutique.serviceRadius} km`} icon={IndianRupee} />
                        <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 group">
                            <dt className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                                <MapPin size={12} className="mr-2" /> Google Maps
                            </dt>
                            <dd className="flex items-center space-x-2">
                                {boutique.googleMapsLink ? (
                                    <a href={boutique.googleMapsLink} target="_blank" rel="noreferrer" className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center hover:bg-primary/20 transition-all">
                                        Open in Maps <ExternalLink size={10} className="ml-1" />
                                    </a>
                                ) : <span className="text-sm font-bold text-gray-400">N/A</span>}
                            </dd>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50">
                            <dt className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Address</dt>
                            <dd className="text-xs font-bold text-gray-700 leading-relaxed">{boutique.fullAddress}</dd>
                        </div>
                    </div>
                </DetailCard>

                {/* Operations */}
                <DetailCard title="Business Operations" icon={Clock}>
                    <div className="space-y-1">
                        <InfoRow label="Open Days" value={boutique.openDays} />
                        <InfoRow label="Opening Time" value={boutique.openingTime} />
                        <InfoRow label="Closing Time" value={boutique.closingTime} />
                        <InfoRow label="Weekly Holiday" value={boutique.weeklyHoliday} />
                        <InfoRow label="Turnaround" value={boutique.turnaroundTime} />
                    </div>
                </DetailCard>

                {/* Services & Features */}
                <DetailCard title="Services & Features" icon={Briefcase}>
                    <div className="space-y-6">
                        <div>
                            <dt className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Services Offered</dt>
                            <div className="flex flex-wrap gap-2">
                                {boutique.servicesOffered?.map((s, i) => <span key={i} className="px-4 py-2 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-100">{s}</span>)}
                            </div>
                        </div>
                        <div>
                            <dt className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Platform Features</dt>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Pickup', val: boutique.pickupAvailable, icon: Truck },
                                    { label: 'Delivery', val: boutique.deliveryAvailable, icon: Truck },
                                    { label: 'Home Visit', val: boutique.homeVisitAvailable, icon: User },
                                    { label: 'Appointments', val: boutique.appointmentBookingAvailable, icon: Clock },
                                    { label: 'Rush Orders', val: boutique.rushOrderAvailable, icon: IndianRupee }
                                ].map((feat, i) => (
                                    <div key={i} className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all ${feat.val ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'}`}>
                                        <feat.icon size={16} />
                                        <span className="text-xs font-black uppercase tracking-widest">{feat.label}</span>
                                        {feat.val ? <CheckCircle size={14} className="ml-auto" /> : <XCircle size={14} className="ml-auto" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DetailCard>

                {/* Media Gallery */}
                <DetailCard title="Media Gallery" icon={ImageIcon} className="lg:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        <div className="space-y-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Logo</p>
                            {displayLogo
                                ? <img src={displayLogo} className="w-full h-32 object-cover rounded-2xl cursor-zoom-in hover:brightness-90 transition-all border border-gray-100 bg-gray-50" onClick={() => setPreviewImage(displayLogo)} />
                                : <div className="w-full h-32 bg-gray-100 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs font-bold">No Logo</div>
                            }
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cover Banner</p>
                            {displayCover
                                ? <img src={displayCover} className="w-full h-32 object-cover rounded-2xl cursor-zoom-in hover:brightness-90 transition-all border border-gray-100 bg-gray-50" onClick={() => setPreviewImage(displayCover)} />
                                : <div className="w-full h-32 bg-gray-100 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center text-gray-300 text-xs font-bold">No Cover</div>
                            }
                        </div>
                        {displayGallery.map((img, i) => (
                            <div key={`${img}-${i}`} className="space-y-2">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Gallery {i+1}</p>
                                <img src={img} className="w-full h-32 object-cover rounded-2xl cursor-zoom-in hover:brightness-90 transition-all border border-gray-100 bg-gray-50" onClick={() => setPreviewImage(img)} />
                            </div>
                        ))}
                    </div>
                </DetailCard>

                {/* Internal Admin Info */}
                <DetailCard title="Internal Admin Info" icon={Shield}>
                    <div className="space-y-6 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verification</p>
                                    <p className={`font-black uppercase tracking-widest text-xs ${boutique.verified ? 'text-blue-600' : 'text-amber-600'}`}>{boutique.verified ? 'Verified' : 'Unverified'}</p>
                                </div>
                                <button onClick={handleToggleVerified} className={`w-12 h-6 rounded-full transition-all relative ${boutique.verified ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${boutique.verified ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Featured</p>
                                    <p className={`font-black uppercase tracking-widest text-xs ${boutique.featuredBoutique ? 'text-amber-600' : 'text-gray-400'}`}>{boutique.featuredBoutique ? 'Featured' : 'Standard'}</p>
                                </div>
                                <button onClick={handleToggleFeatured} className={`w-12 h-6 rounded-full transition-all relative ${boutique.featuredBoutique ? 'bg-amber-500' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${boutique.featuredBoutique ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <dt className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Verification Documents</dt>
                            <div className="space-y-2">
                                {boutique.verificationDocuments?.map((doc, i) => (
                                    <div key={i} className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all group">
                                        <Shield size={16} className="text-gray-400 group-hover:text-primary mr-3" />
                                        <span className="font-bold text-gray-700 truncate flex-1">Document {i+1}</span>
                                        <button onClick={() => setPreviewImage(doc)} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Preview</button>
                                    </div>
                                ))}
                                {(!boutique.verificationDocuments || boutique.verificationDocuments.length === 0) && <p className="text-gray-400 italic text-xs">No documents uploaded.</p>}
                            </div>
                        </div>
                        
                        <div>
                            <dt className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Payout Verification</dt>
                            <div className="p-5 bg-gray-900 rounded-[2rem] space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-mono text-gray-400 tracking-wider text-sm">•••• •••• •••• {boutique.payoutDetails?.slice(-4) || 'XXXX'}</p>
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        boutique.payoutStatus === 'Verified' ? 'bg-green-500/20 text-green-400' : 
                                        boutique.payoutStatus === 'Rejected' ? 'bg-red-500/20 text-red-400' : 
                                        'bg-amber-500/20 text-amber-400'
                                    }`}>
                                        {boutique.payoutStatus || 'Pending'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Pending', 'Verified', 'Rejected'].map(s => (
                                        <button 
                                            key={s}
                                            onClick={() => handlePayoutStatusChange(s)}
                                            className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                boutique.payoutStatus === s ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </DetailCard>
            </div>
        </div>
    );
};

export default BoutiqueProfileTab;
