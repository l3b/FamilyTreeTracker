import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

interface FamilyViewProps {
  members: any[];
  onDeleteMember: (id: number) => void;
  onAddMember: (relationship: string, relatedTo?: number) => void;
  centerPerson?: any;
  onCenterChange?: (person: any) => void;
}

export default function FamilyView({ members, onDeleteMember, onAddMember, centerPerson: propCenterPerson, onCenterChange }: FamilyViewProps) {
  const { user } = useAuth();
  const [localCenterPerson, setLocalCenterPerson] = useState<any>(null);

  // Find or create the main user profile
  const getMainProfile = () => {
    if (!user) return null;
    
    // Look for existing main profile
    let mainProfile = members.find((m: any) => 
      (m.firstName === (user as any).firstName && m.lastName === (user as any).lastName) ||
      m.notes?.includes('Main Profile') ||
      m.userId === (user as any).id
    );

    // If no main profile exists, create a virtual one from user data
    if (!mainProfile && user) {
      mainProfile = {
        id: 'main',
        firstName: (user as any).firstName || 'المستخدم',
        lastName: (user as any).lastName || 'الرئيسي',
        arabicName: (user as any).arabicName || `${(user as any).firstName} ${(user as any).lastName}`,
        profileImageUrl: (user as any).profileImageUrl,
        userId: (user as any).id,
        isMainProfile: true,
        birthDate: null,
        gender: null,
        occupation: null,
      };
    }

    return mainProfile;
  };

  const mainProfile = getMainProfile();
  const currentCenter = propCenterPerson || localCenterPerson || mainProfile;

  if (!currentCenter) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-heritage-brown mb-4">أنشئ ملفك الشخصي</h3>
        <button 
          onClick={() => onAddMember('self')}
          className="bg-heritage-brown text-white px-6 py-3 rounded-lg hover:bg-heritage-dark transition-colors"
        >
          إنشاء الملف الشخصي
        </button>
      </div>
    );
  }

  // Find family relationships for current center person
  const getRelatives = (person: any) => {
    const relatives = {
      father: members.find(m => m.id === person.fatherId),
      mother: members.find(m => m.id === person.motherId),
      spouse: members.find(m => m.id === person.spouseId),
      children: members.filter(m => m.fatherId === person.id || m.motherId === person.id),
      siblings: members.filter(m => 
        (m.fatherId === person.fatherId && person.fatherId) ||
        (m.motherId === person.motherId && person.motherId)
      ).filter(m => m.id !== person.id),
      
      // Grandparents
      paternalGrandfather: null,
      paternalGrandmother: null,
      maternalGrandfather: null,
      maternalGrandmother: null,
    };

    // Find grandparents
    if (relatives.father) {
      relatives.paternalGrandfather = members.find(m => m.id === relatives.father.fatherId);
      relatives.paternalGrandmother = members.find(m => m.id === relatives.father.motherId);
    }
    if (relatives.mother) {
      relatives.maternalGrandfather = members.find(m => m.id === relatives.mother.fatherId);
      relatives.maternalGrandmother = members.find(m => m.id === relatives.mother.motherId);
    }

    return relatives;
  };

  const relatives = getRelatives(currentCenter);

  const renderPersonCard = (person: any, relationship: string, size: 'sm' | 'md' | 'lg' = 'md', onClickAdd?: () => void) => {
    if (!person) {
      return (
        <div 
          onClick={onClickAdd}
          className="flex flex-col items-center cursor-pointer group"
        >
          <div className={`
            ${size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-20 h-20' : 'w-16 h-16'}
            border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center
            hover:border-heritage-brown hover:bg-heritage-light transition-all
          `}>
            <i className="fas fa-plus text-gray-400 group-hover:text-heritage-brown"></i>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            إضافة {relationship}
          </div>
        </div>
      );
    }

    const isCenter = person.id === currentCenter.id;
    
    return (
      <div className="flex flex-col items-center group relative">
        <div 
          onClick={() => !isCenter && onCenterChange && onCenterChange(person)}
          className={`
            ${size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-20 h-20' : 'w-16 h-16'}
            ${isCenter ? 'border-4 border-heritage-brown bg-heritage-light' : 'border-2 border-blue-300 bg-blue-50'}
            rounded-lg flex items-center justify-center relative cursor-pointer
            hover:shadow-lg transition-all overflow-hidden
          `}
        >
          {person.profileImageUrl ? (
            <img
              src={person.profileImageUrl}
              alt={person.firstName}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className={`${isCenter ? 'text-heritage-brown' : 'text-blue-600'} text-lg`}>
              <i className={`fas ${person.gender === 'ذكر' ? 'fa-male' : person.gender === 'أنثى' ? 'fa-female' : 'fa-user'}`}></i>
            </div>
          )}
          
          {/* Delete button */}
          {!isCenter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMember(person.id);
              }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="text-center mt-2 min-w-[80px]">
          <Link href={`/member/${person.id}`} className={`text-xs font-medium ${isCenter ? 'text-heritage-brown' : 'text-gray-800'} hover:underline cursor-pointer`}>
            {person.firstName} {person.lastName}
          </Link>
          {person.arabicName && person.arabicName !== `${person.firstName} ${person.lastName}` && (
            <div className="text-xs text-gray-500">{person.arabicName}</div>
          )}
          {person.birthDate && (
            <div className="text-xs text-gray-400">
              {new Date(person.birthDate).getFullYear()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="family-view-container bg-gradient-to-b from-heritage-light to-white min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-heritage-brown mb-2">شجرة العائلة</h2>
          <p className="text-gray-600">
            {currentCenter.firstName} {currentCenter.lastName} في المركز
          </p>
        </div>

        {/* Family Tree Grid */}
        <div className="relative">
          {/* Grandparents Row */}
          <div className="grid grid-cols-4 gap-8 mb-8">
            <div className="text-center">
              {renderPersonCard(
                relatives.paternalGrandfather,
                'جد الأب',
                'sm',
                () => onAddMember('paternalGrandfather', currentCenter.id)
              )}
            </div>
            <div className="text-center">
              {renderPersonCard(
                relatives.paternalGrandmother,
                'جدة الأب',
                'sm',
                () => onAddMember('paternalGrandmother', currentCenter.id)
              )}
            </div>
            <div className="text-center">
              {renderPersonCard(
                relatives.maternalGrandfather,
                'جد الأم',
                'sm',
                () => onAddMember('maternalGrandfather', currentCenter.id)
              )}
            </div>
            <div className="text-center">
              {renderPersonCard(
                relatives.maternalGrandmother,
                'جدة الأم',
                'sm',
                () => onAddMember('maternalGrandmother', currentCenter.id)
              )}
            </div>
          </div>

          {/* Connection lines for grandparents to parents */}
          <svg className="absolute top-20 left-0 w-full h-16" style={{ zIndex: 1 }}>
            {/* Paternal line */}
            <line x1="12.5%" y1="0" x2="12.5%" y2="32" stroke="#8B4513" strokeWidth="1"/>
            <line x1="37.5%" y1="0" x2="37.5%" y2="32" stroke="#8B4513" strokeWidth="1"/>
            <line x1="12.5%" y1="32" x2="37.5%" y2="32" stroke="#8B4513" strokeWidth="1"/>
            <line x1="25%" y1="32" x2="25%" y2="64" stroke="#8B4513" strokeWidth="1"/>
            
            {/* Maternal line */}
            <line x1="62.5%" y1="0" x2="62.5%" y2="32" stroke="#8B4513" strokeWidth="1"/>
            <line x1="87.5%" y1="0" x2="87.5%" y2="32" stroke="#8B4513" strokeWidth="1"/>
            <line x1="62.5%" y1="32" x2="87.5%" y2="32" stroke="#8B4513" strokeWidth="1"/>
            <line x1="75%" y1="32" x2="75%" y2="64" stroke="#8B4513" strokeWidth="1"/>
          </svg>

          {/* Parents Row */}
          <div className="grid grid-cols-4 gap-8 mb-8 relative" style={{ zIndex: 2 }}>
            <div></div>
            <div className="text-center">
              {renderPersonCard(
                relatives.father,
                'الأب',
                'md',
                () => onAddMember('father', currentCenter.id)
              )}
            </div>
            <div className="text-center">
              {renderPersonCard(
                relatives.mother,
                'الأم',
                'md',
                () => onAddMember('mother', currentCenter.id)
              )}
            </div>
            <div></div>
          </div>

          {/* Connection line from parents to center */}
          <svg className="absolute top-48 left-0 w-full h-16" style={{ zIndex: 1 }}>
            <line x1="37.5%" y1="0" x2="37.5%" y2="32" stroke="#8B4513" strokeWidth="2"/>
            <line x1="62.5%" y1="0" x2="62.5%" y2="32" stroke="#8B4513" strokeWidth="2"/>
            <line x1="37.5%" y1="32" x2="62.5%" y2="32" stroke="#8B4513" strokeWidth="2"/>
            <line x1="50%" y1="32" x2="50%" y2="64" stroke="#8B4513" strokeWidth="2"/>
          </svg>

          {/* Center Person Row */}
          <div className="grid grid-cols-3 gap-8 mb-8 items-center relative" style={{ zIndex: 2 }}>
            <div className="text-center">
              {renderPersonCard(
                relatives.spouse,
                'الزوج/الزوجة',
                'md',
                () => onAddMember('spouse', currentCenter.id)
              )}
            </div>
            <div className="text-center">
              {renderPersonCard(currentCenter, 'أنت', 'lg')}
            </div>
            <div className="text-center">
              {/* Siblings */}
              {relatives.siblings.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-2">الأشقاء</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {relatives.siblings.slice(0, 3).map((sibling, index) => (
                      <div key={sibling.id} className="transform scale-75">
                        {renderPersonCard(sibling, 'شقيق', 'sm')}
                      </div>
                    ))}
                    {relatives.siblings.length > 3 && (
                      <div className="text-xs text-gray-500">+{relatives.siblings.length - 3}</div>
                    )}
                  </div>
                </div>
              ) : (
                renderPersonCard(
                  null,
                  'شقيق/شقيقة',
                  'sm',
                  () => onAddMember('sibling', currentCenter.id)
                )
              )}
            </div>
          </div>

          {/* Connection line to children */}
          {relatives.children.length > 0 && (
            <svg className="absolute bottom-24 left-0 w-full h-16" style={{ zIndex: 1 }}>
              <line x1="50%" y1="0" x2="50%" y2="32" stroke="#8B4513" strokeWidth="2"/>
              <line x1="25%" y1="32" x2="75%" y2="32" stroke="#8B4513" strokeWidth="1"/>
              {relatives.children.map((_, index) => {
                const childCount = Math.min(relatives.children.length, 4);
                const spacing = 50 / (childCount + 1);
                const x = 25 + spacing * (index + 1);
                return (
                  <line key={index} x1={`${x}%`} y1="32" x2={`${x}%`} y2="64" stroke="#8B4513" strokeWidth="1"/>
                );
              })}
            </svg>
          )}

          {/* Children Row */}
          <div className="flex justify-center gap-6 relative" style={{ zIndex: 2 }}>
            {relatives.children.length > 0 ? (
              relatives.children.map((child) => (
                <div key={child.id}>
                  {renderPersonCard(child, 'ابن/ابنة', 'sm')}
                </div>
              ))
            ) : (
              <div>
                {renderPersonCard(
                  null,
                  'إضافة ابن',
                  'sm',
                  () => onAddMember('child', currentCenter.id)
                )}
              </div>
            )}
            {relatives.children.length > 0 && (
              <div>
                {renderPersonCard(
                  null,
                  'إضافة ابن',
                  'sm',
                  () => onAddMember('child', currentCenter.id)
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation hint */}
        <div className="text-center mt-8 p-4 bg-white rounded-lg shadow">
          <p className="text-sm text-gray-600">
            انقر على أي فرد لجعله مركز الشجرة • انقر على + لإضافة أفراد جدد
          </p>
        </div>
      </div>
    </div>
  );
}