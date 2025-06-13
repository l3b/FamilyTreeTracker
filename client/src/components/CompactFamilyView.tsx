import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CompactFamilyViewProps {
  members: any[];
  onDeleteMember: (id: number) => void;
  onAddMember: (relationship: string, relatedTo?: number) => void;
}

export default function CompactFamilyView({ members, onDeleteMember, onAddMember }: CompactFamilyViewProps) {
  const { user } = useAuth();
  const [centerPerson, setCenterPerson] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ancestors: false,
    descendants: false,
    siblings: false
  });

  // Find or create the main user profile
  const getMainProfile = () => {
    if (!user) return null;
    
    let mainProfile = members.find((m: any) => 
      (m.firstName === (user as any).firstName && m.lastName === (user as any).lastName) ||
      m.notes?.includes('Main Profile') ||
      m.userId === (user as any).id
    );

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
  const currentCenter = centerPerson || mainProfile;

  if (!currentCenter) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-semibold text-heritage-brown mb-4">أنشئ ملفك الشخصي</h3>
        <Button 
          onClick={() => onAddMember('self')}
          className="bg-heritage-brown text-white px-6 py-3 rounded-lg hover:bg-heritage-dark transition-colors"
        >
          إنشاء الملف الشخصي
        </Button>
      </div>
    );
  }

  // Get immediate family relationships
  const getImmediateFamily = (person: any) => {
    return {
      father: members.find(m => m.id === person.fatherId),
      mother: members.find(m => m.id === person.motherId),
      spouse: members.find(m => m.id === person.spouseId),
      children: members.filter(m => m.fatherId === person.id || m.motherId === person.id).slice(0, 3),
      siblings: members.filter(m => 
        (m.fatherId === person.fatherId && person.fatherId) ||
        (m.motherId === person.motherId && person.motherId)
      ).filter(m => m.id !== person.id).slice(0, 3),
    };
  };

  const family = getImmediateFamily(currentCenter);

  const renderPersonCard = (person: any, relationship: string, size: 'sm' | 'md' | 'lg' = 'md', onClickAdd?: () => void) => {
    if (!person) {
      return (
        <div 
          onClick={onClickAdd}
          className="flex flex-col items-center cursor-pointer group p-2"
        >
          <div className={`
            ${size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-10 h-10'}
            border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center
            hover:border-heritage-brown hover:bg-heritage-light transition-all
          `}>
            <i className="fas fa-plus text-gray-400 group-hover:text-heritage-brown text-sm"></i>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            {relationship}
          </div>
        </div>
      );
    }

    const isCenter = person.id === currentCenter.id;
    
    return (
      <div className="flex flex-col items-center group relative p-2">
        <div 
          onClick={() => !isCenter && setCenterPerson(person)}
          className={`
            ${size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-10 h-10'}
            ${isCenter ? 'border-3 border-heritage-brown bg-heritage-light' : 'border-2 border-blue-300 bg-blue-50'}
            rounded-lg flex items-center justify-center relative cursor-pointer
            hover:shadow-md transition-all overflow-hidden
          `}
        >
          {person.profileImageUrl ? (
            <img
              src={person.profileImageUrl}
              alt={person.firstName}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className={`${isCenter ? 'text-heritage-brown' : 'text-blue-600'} ${size === 'lg' ? 'text-lg' : 'text-sm'}`}>
              <i className={`fas ${person.gender === 'ذكر' ? 'fa-male' : person.gender === 'أنثى' ? 'fa-female' : 'fa-user'}`}></i>
            </div>
          )}
          
          {!isCenter && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteMember(person.id);
              }}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="text-center mt-1">
          <div className={`text-xs font-medium ${isCenter ? 'text-heritage-brown' : 'text-gray-800'} truncate max-w-[60px]`}>
            {person.firstName}
          </div>
          {person.birthDate && (
            <div className="text-xs text-gray-400">
              {new Date(person.birthDate).getFullYear()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="compact-family-view bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-heritage-brown mb-2">عرض العائلة المبسط</h2>
        <p className="text-gray-600 text-sm">
          {currentCenter.firstName} {currentCenter.lastName} في المركز
        </p>
      </div>

      {/* Immediate Family - Always Visible */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-heritage-brown mb-3 text-center">الأسرة المباشرة</h3>
          
          {/* Parents Row */}
          <div className="flex justify-center items-center gap-8 mb-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">الأب</div>
              {renderPersonCard(
                family.father,
                'إضافة الأب',
                'md',
                () => onAddMember('father', currentCenter.id)
              )}
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">الأم</div>
              {renderPersonCard(
                family.mother,
                'إضافة الأم',
                'md',
                () => onAddMember('mother', currentCenter.id)
              )}
            </div>
          </div>

          {/* Center Row - User and Spouse */}
          <div className="flex justify-center items-center gap-12 mb-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">الزوج/الزوجة</div>
              {renderPersonCard(
                family.spouse,
                'إضافة زوج/زوجة',
                'md',
                () => onAddMember('spouse', currentCenter.id)
              )}
            </div>
            <div className="text-center">
              <div className="text-xs text-heritage-brown mb-2 font-semibold">أنت</div>
              {renderPersonCard(currentCenter, 'أنت', 'lg')}
            </div>
          </div>

          {/* Children - First 3 */}
          {(family.children.length > 0 || true) && (
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">الأطفال</div>
              <div className="flex justify-center gap-4">
                {family.children.map((child) => (
                  <div key={child.id}>
                    {renderPersonCard(child, 'ابن/ابنة', 'sm')}
                  </div>
                ))}
                {family.children.length === 0 && (
                  renderPersonCard(
                    null,
                    'إضافة طفل',
                    'sm',
                    () => onAddMember('child', currentCenter.id)
                  )
                )}
                {family.children.length > 0 && family.children.length < 3 && (
                  renderPersonCard(
                    null,
                    'إضافة طفل',
                    'sm',
                    () => onAddMember('child', currentCenter.id)
                  )
                )}
              </div>
              {family.children.length > 3 && (
                <div className="text-xs text-gray-500 mt-2">
                  +{family.children.length - 3} أطفال آخرين
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expandable Sections for Large Families */}
      <div className="space-y-2">
        {/* Siblings */}
        {family.siblings.length > 0 && (
          <Card>
            <CardContent className="p-3">
              <button
                onClick={() => toggleSection('siblings')}
                className="w-full flex items-center justify-between text-sm font-medium text-heritage-brown hover:bg-heritage-light p-2 rounded"
              >
                <span>الأشقاء ({family.siblings.length})</span>
                <i className={`fas fa-chevron-${expandedSections.siblings ? 'up' : 'down'}`}></i>
              </button>
              {expandedSections.siblings && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {family.siblings.map((sibling) => (
                    <div key={sibling.id} className="transform scale-90">
                      {renderPersonCard(sibling, 'شقيق', 'sm')}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <Card>
          <CardContent className="p-3">
            <div className="text-center text-sm text-gray-600">
              <span className="font-medium text-heritage-brown">{members.length}</span> فرد في شجرة العائلة
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Help */}
      <div className="text-center mt-4 text-xs text-gray-500">
        انقر على أي فرد لجعله مركز الشجرة • انقر على + لإضافة أفراد جدد
      </div>
    </div>
  );
}