import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, ZoomIn, ZoomOut, Users } from "lucide-react";

interface FamilyViewProps {
  members: any[];
  onDeleteMember: (id: number) => void;
  onAddMember: (relationship: string, relatedTo?: number) => void;
  centerPerson?: any;
  onCenterChange?: (person: any) => void;
  showMalesOnly?: boolean;
}

export default function FamilyView({ members, onDeleteMember, onAddMember, centerPerson: propCenterPerson, onCenterChange, showMalesOnly = false }: FamilyViewProps) {
  const { user } = useAuth();
  const [localCenterPerson, setLocalCenterPerson] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(2); // 1 = minimal, 2 = normal, 3 = extended, 4 = full

  // Get linked profile
  const { data: linkedProfile } = useQuery({
    queryKey: ["/api/auth/linked-profile"],
    retry: false,
  });

  const currentCenter = propCenterPerson || localCenterPerson || linkedProfile || members[0];

  // Filter members based on male-only view and paternal lineage
  const getFilteredMembers = () => {
    if (!showMalesOnly) return members;
    
    // For male-only view, we want to show the paternal lineage
    const maleMembers = members.filter(member => 
      member.gender === 'male' || member.gender === 'ذكر'
    );
    
    return maleMembers;
  };

  const filteredMembers = getFilteredMembers();

  // Enhanced relationship finder that includes extended family based on zoom level
  const getExtendedRelatives = (person: any, members: any[], level: number) => {
    const relatives: any = {
      // Core family
      father: members.find(m => m.id === person.fatherId),
      mother: showMalesOnly ? null : members.find(m => m.id === person.motherId),
      spouse: showMalesOnly ? null : members.find(m => m.id === person.spouseId),
      children: members.filter(m => m.fatherId === person.id || m.motherId === person.id),
      siblings: members.filter(m => 
        (m.fatherId === person.fatherId && person.fatherId) ||
        (!showMalesOnly && m.motherId === person.motherId && person.motherId)
      ).filter(m => m.id !== person.id),
      
      // Extended family (based on zoom level)
      paternalUncles: [],
      maternalUncles: [],
      paternalGrandfather: null,
      paternalGrandmother: null,
      maternalGrandfather: null,
      maternalGrandmother: null,
      paternalGreatGrandfather: null,
      paternalGreatUncles: [],
    };

    // Find father's family
    if (relatives.father) {
      relatives.paternalGrandfather = members.find(m => m.id === relatives.father.fatherId);
      if (!showMalesOnly) {
        relatives.paternalGrandmother = members.find(m => m.id === relatives.father.motherId);
      }
      
      // Paternal uncles (father's brothers)
      if (level >= 2) {
        relatives.paternalUncles = members.filter(m => 
          m.fatherId === relatives.father.fatherId && 
          m.id !== relatives.father.id &&
          (showMalesOnly ? (m.gender === 'male' || m.gender === 'ذكر') : true)
        );
      }
    }

    // Find mother's family (only if not male-only view)
    if (!showMalesOnly && relatives.mother) {
      relatives.maternalGrandfather = members.find(m => m.id === relatives.mother.fatherId);
      relatives.maternalGrandmother = members.find(m => m.id === relatives.mother.motherId);
      
      if (level >= 2) {
        relatives.maternalUncles = members.filter(m => 
          m.fatherId === relatives.mother.fatherId && 
          m.id !== relatives.mother.id
        );
      }
    }

    // Great-grandfather and his brothers (level 3+)
    if (level >= 3 && relatives.paternalGrandfather) {
      relatives.paternalGreatGrandfather = members.find(m => m.id === relatives.paternalGrandfather.fatherId);
      
      if (relatives.paternalGreatGrandfather) {
        relatives.paternalGreatUncles = members.filter(m => 
          m.fatherId === relatives.paternalGreatGrandfather.id && 
          m.id !== relatives.paternalGrandfather.id &&
          (showMalesOnly ? (m.gender === 'male' || m.gender === 'ذكر') : true)
        );
      }
    }

    return relatives;
  };

  const relatives = getExtendedRelatives(currentCenter, filteredMembers, zoomLevel);

  if (!currentCenter) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-heritage-brown mb-4">لا توجد أفراد في العائلة</h3>
        <button 
          onClick={() => onAddMember('person')}
          className="bg-heritage-brown text-white px-6 py-3 rounded-lg hover:bg-heritage-dark transition-colors"
        >
          إضافة فرد جديد
        </button>
      </div>
    );
  }



  const renderPersonCard = (
    person: any,
    relationship: string,
    size: 'sm' | 'md' | 'lg' = 'md',
    onClickAdd?: () => void,
    filteredOut: boolean = false
  ) => {
    if (!person) {
      if (filteredOut) {
        return (
          <div className="flex flex-col items-center">
            <div
              className={`
                ${size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-20 h-20' : 'w-16 h-16'}
                border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100
              `}
            >
              <i className="fas fa-user-slash text-gray-400"></i>
            </div>
            <div className="text-xs text-gray-400 mt-2 text-center">مخفي</div>
          </div>
        );
      }

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
    const isLinkedProfile = linkedProfile && person.id === linkedProfile.id;
    
    return (
      <div className="flex flex-col items-center group relative">
        <div 
          onClick={() => !isCenter && onCenterChange && onCenterChange(person)}
          className={`
            ${size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-20 h-20' : 'w-16 h-16'}
            ${isCenter ? 'border-4 border-heritage-brown bg-heritage-light' : 'border-2 border-blue-300 bg-blue-50'}
            ${isLinkedProfile ? 'ring-2 ring-green-500' : ''}
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
          
          {/* Linked profile indicator */}
          {isLinkedProfile && (
            <div className="absolute -top-1 -left-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              <Crown className="h-3 w-3" />
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
          {isLinkedProfile && (
            <Badge variant="secondary" className="text-xs mt-1">
              حسابك
            </Badge>
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

  const getZoomLabel = (level: number) => {
    switch(level) {
      case 1: return 'الأسرة المباشرة';
      case 2: return 'العائلة القريبة';
      case 3: return 'العائلة الممتدة';
      case 4: return 'النسب الكامل';
      default: return 'عادي';
    }
  };

  return (
    <div className="family-view-container bg-gradient-to-b from-heritage-light to-white min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Zoom Controls */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-heritage-brown mb-2">شجرة العائلة</h2>
          <p className="text-gray-600 mb-4">
            {currentCenter.firstName} {currentCenter.lastName} في المركز
            {showMalesOnly && ' - عرض الرجال فقط (النسب الأبوي)'}
          </p>
          
          {/* Zoom Controls */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
              disabled={zoomLevel === 1}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ZoomOut className="h-4 w-4" />
              أقل تفصيلاً
            </Button>
            
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              {getZoomLabel(zoomLevel)} ({zoomLevel}/4)
            </Badge>
            
            <Button
              onClick={() => setZoomLevel(Math.min(4, zoomLevel + 1))}
              disabled={zoomLevel === 4}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <ZoomIn className="h-4 w-4" />
              أكثر تفصيلاً
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            المستوى {zoomLevel}: {getZoomLabel(zoomLevel)}
          </div>
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
                showMalesOnly ? undefined : () => onAddMember('paternalGrandmother', currentCenter.id),
                showMalesOnly && !relatives.paternalGrandmother
              )}
            </div>
            <div className="text-center">
            {renderPersonCard(
                relatives.maternalGrandfather,
                'جد الأم',
                'sm',
                showMalesOnly ? undefined : () => onAddMember('maternalGrandfather', currentCenter.id),
                showMalesOnly && !relatives.maternalGrandfather
              )}
            </div>
            <div className="text-center">
            {renderPersonCard(
                relatives.maternalGrandmother,
                'جدة الأم',
                'sm',
                showMalesOnly ? undefined : () => onAddMember('maternalGrandmother', currentCenter.id),
                showMalesOnly && !relatives.maternalGrandmother
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
                showMalesOnly ? undefined : () => onAddMember('mother', currentCenter.id),
                showMalesOnly && !relatives.mother
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
                showMalesOnly ? undefined : () => onAddMember('spouse', currentCenter.id),
                showMalesOnly && !relatives.spouse
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
          <div className="grid grid-cols-4 gap-4 relative" style={{ zIndex: 2 }}>
            {relatives.children.slice(0, 4).map((child, index) => (
              <div key={child.id} className="text-center">
                {renderPersonCard(child, 'ابن/ابنة', 'sm')}
              </div>
            ))}
            {relatives.children.length === 0 && (
              <div className="col-span-4 text-center">
                {renderPersonCard(
                  null,
                  'إضافة ابن',
                  'sm',
                  () => onAddMember('child', currentCenter.id)
                )}
              </div>
            )}
            {relatives.children.length > 0 && relatives.children.length < 4 && (
              <div className="text-center">
                {renderPersonCard(
                  null,
                  'إضافة ابن',
                  'sm',
                  () => onAddMember('child', currentCenter.id)
                )}
              </div>
            )}
          </div>

          {/* Extended Family Sections based on Zoom Level */}
          {zoomLevel >= 2 && (
            <div className="mt-12 space-y-8">
              {/* Paternal Uncles */}
              {relatives.paternalUncles.length > 0 && (
                <div className="bg-heritage-light rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-heritage-brown mb-4 text-center">
                    أعمام الأب
                  </h3>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {relatives.paternalUncles.map((uncle) => (
                      <div key={uncle.id} className="transform scale-90">
                        {renderPersonCard(uncle, 'عم', 'sm')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maternal Uncles (only if not male-only view) */}
              {!showMalesOnly && relatives.maternalUncles.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-700 mb-4 text-center">
                    أخوال الأم
                  </h3>
                  <div className="flex flex-wrap gap-4 justify-center">
                    {relatives.maternalUncles.map((uncle) => (
                      <div key={uncle.id} className="transform scale-90">
                        {renderPersonCard(uncle, 'خال', 'sm')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Great-Grandfather and Great-Uncles (Level 3+) */}
          {zoomLevel >= 3 && (
            <div className="mt-12 space-y-8">
              {relatives.paternalGreatGrandfather && (
                <div className="bg-heritage-beige rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-heritage-brown mb-4 text-center">
                    الجد الأكبر وأشقاؤه
                  </h3>
                  <div className="flex flex-wrap gap-4 justify-center items-center">
                    <div className="transform scale-110">
                      {renderPersonCard(relatives.paternalGreatGrandfather, 'الجد الأكبر', 'md')}
                    </div>
                    {relatives.paternalGreatUncles.map((greatUncle) => (
                      <div key={greatUncle.id} className="transform scale-90">
                        {renderPersonCard(greatUncle, 'شقيق الجد', 'sm')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statistics and Information Panel */}
          {zoomLevel >= 4 && (
            <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-heritage-brown mb-4 text-center">
                إحصائيات النسب
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-heritage-light rounded p-3">
                  <div className="text-2xl font-bold text-heritage-brown">
                    {filteredMembers.length}
                  </div>
                  <div className="text-sm text-gray-600">
                    {showMalesOnly ? 'الرجال' : 'إجمالي الأفراد'}
                  </div>
                </div>
                <div className="bg-blue-50 rounded p-3">
                  <div className="text-2xl font-bold text-blue-700">
                    {relatives.children.length}
                  </div>
                  <div className="text-sm text-gray-600">الأبناء</div>
                </div>
                <div className="bg-green-50 rounded p-3">
                  <div className="text-2xl font-bold text-green-700">
                    {relatives.siblings.length}
                  </div>
                  <div className="text-sm text-gray-600">الأشقاء</div>
                </div>
                <div className="bg-yellow-50 rounded p-3">
                  <div className="text-2xl font-bold text-yellow-700">
                    {relatives.paternalUncles.length + relatives.maternalUncles.length}
                  </div>
                  <div className="text-sm text-gray-600">الأعمام والأخوال</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}