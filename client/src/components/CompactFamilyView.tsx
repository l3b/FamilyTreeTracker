import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

interface CompactFamilyViewProps {
  members: any[];
  onDeleteMember: (id: number) => void;
  onAddMember: (relationship: string, relatedTo?: number) => void;
  centerPerson?: any;
  onCenterChange?: (person: any) => void;
  showMalesOnly?: boolean;
}

export default function CompactFamilyView({ members, onDeleteMember, onAddMember, centerPerson: propCenterPerson, onCenterChange, showMalesOnly = false }: CompactFamilyViewProps) {
  const { user } = useAuth();
  const [localCenterPerson, setLocalCenterPerson] = useState<any>(null);
  const [showAllChildren, setShowAllChildren] = useState(false);
  const [showAllSiblings, setShowAllSiblings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    ancestors: false,
    descendants: false,
    siblings: false
  });

  // Get linked profile
  const { data: linkedProfile } = useQuery({
    queryKey: ["/api/auth/linked-profile"],
    retry: false,
  });

  const currentCenter = propCenterPerson || localCenterPerson || linkedProfile || members[0];

  // Enhanced Arabic name search - includes father's and grandfather's names
  const getFullArabicName = (member: any) => {
    if (!member) return '';
    
    // Find father
    const father = members.find(m => m.id === member.fatherId);
    const grandfather = father ? members.find(m => m.id === father.fatherId) : null;
    
    // Build full Arabic name pattern: "الاسم بن الأب بن الجد"
    let fullName = member.firstName || '';
    if (father) {
      fullName += ` بن ${father.firstName}`;
      if (grandfather) {
        fullName += ` بن ${grandfather.firstName}`;
      }
    }
    
    return fullName;
  };

  // Filter members based on search term - supports Arabic naming patterns
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const fullArabicName = getFullArabicName(member).toLowerCase();
    
    return (
      member.firstName?.toLowerCase().includes(searchLower) ||
      member.lastName?.toLowerCase().includes(searchLower) ||
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchLower) ||
      fullArabicName.includes(searchLower) ||
      member.arabicName?.toLowerCase().includes(searchLower)
    );
  });

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

  // Get immediate family relationships with improved logic
  const getImmediateFamily = (person: any) => {
    const father = members.find(m => m.id === person.fatherId);
    const mother = members.find(m => m.id === person.motherId);
    const spouse = members.find(m => m.id === person.spouseId);
    
    // Find all children (where this person is father or mother)
    const allChildren = members.filter(m => m.fatherId === person.id || m.motherId === person.id);
    
    // Find all siblings (same father or mother, excluding self)
    const allSiblings = members.filter(m => {
      if (m.id === person.id) return false;
      return (m.fatherId === person.fatherId && person.fatherId) ||
             (m.motherId === person.motherId && person.motherId);
    });
    
    return {
      father,
      mother,
      spouse,
      children: allChildren,
      siblings: allSiblings,
      // For display purposes
      displayChildren: showAllChildren ? allChildren : allChildren.slice(0, 3),
      displaySiblings: showAllSiblings ? allSiblings : allSiblings.slice(0, 3),
    };
  };

  const family = getImmediateFamily(currentCenter);

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
          <div className="flex flex-col items-center p-2">
            <div
              className={`
                ${size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-10 h-10'}
                border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100
              `}
            >
              <i className="fas fa-user-slash text-gray-400 text-sm"></i>
            </div>
            <div className="text-xs text-gray-400 mt-1 text-center">مخفي</div>
          </div>
        );
      }

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
    const isLinkedProfile = linkedProfile && person.id === linkedProfile.id;
    
    return (
      <div className="flex flex-col items-center group relative p-2">
        <div 
          onClick={() => !isCenter && onCenterChange && onCenterChange(person)}
          className={`
            ${size === 'lg' ? 'w-16 h-16' : size === 'md' ? 'w-12 h-12' : 'w-10 h-10'}
            ${isCenter ? 'border-3 border-heritage-brown bg-heritage-light' : 'border-2 border-blue-300 bg-blue-50'}
            ${isLinkedProfile ? 'ring-2 ring-green-500' : ''}
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
              <i className={`fas ${person.gender === 'male' || person.gender === 'ذكر' ? 'fa-male' : person.gender === 'female' || person.gender === 'أنثى' ? 'fa-female' : 'fa-user'}`}></i>
            </div>
          )}
          
          {/* Linked profile indicator */}
          {isLinkedProfile && (
            <div className="absolute -top-1 -left-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
              <Crown className="h-2 w-2" />
            </div>
          )}
          
          {!isCenter && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMember(person.id);
                }}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                <i className="fas fa-times"></i>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCenterChange && onCenterChange(person);
                }}
                className="absolute -top-1 -left-1 bg-heritage-brown text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                title="اجعلني في المركز"
              >
                <i className="fas fa-user"></i>
              </button>
            </>
          )}
        </div>
        
        <div className="text-center mt-1">
          <Link href={`/member/${person.id}`} className={`text-xs font-medium ${isCenter ? 'text-heritage-brown' : 'text-gray-800'} truncate max-w-[60px] hover:underline cursor-pointer block`}>
            {person.firstName}
          </Link>
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

      {/* Search and Person Selector */}
      <div className="bg-gradient-to-r from-heritage-light to-heritage-beige border border-heritage-brown rounded-lg p-3 mb-4">
        <div className="text-center">
          <div className="text-sm font-semibold text-heritage-brown mb-2">
            {linkedProfile ? 'تغيير المركز' : 'اختر شخصاً من الشجرة'}
          </div>
          
          {/* Search Input */}
          <div className="mb-3">
            <Input
              type="text"
              placeholder="ابحث بالاسم الكامل مثل: عبدالله بن عادل بن عبدالله..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-md mx-auto text-sm"
              dir="rtl"
            />
          </div>
          
          {searchTerm && (
            <div className="text-xs text-heritage-brown mb-2 bg-white rounded px-2 py-1 max-w-md mx-auto">
              مثال للبحث: اكتب "عبدالله بن عادل" للعثور على عبدالله ابن عادل
            </div>
          )}
          
          <div className="text-xs text-gray-600 mb-2">
            انقر على أي شخص في الشجرة لجعله في المركز • أو استخدم الزر الأزرق 👤 بجانب كل شخص
          </div>
          
          {/* Quick Person Selector */}
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {(searchTerm ? filteredMembers : members).slice(0, 6).map((member) => {
              const fullArabicName = getFullArabicName(member);
              const displayName = fullArabicName || `${member.firstName} ${member.lastName}`;
              
              return (
                <button
                  key={member.id}
                  onClick={() => onCenterChange && onCenterChange(member)}
                  className={`px-2 py-1 rounded text-xs transition-all max-w-[200px] ${
                    member.id === currentCenter.id
                      ? 'bg-heritage-brown text-white font-semibold'
                      : 'bg-white text-heritage-brown border border-heritage-brown hover:bg-heritage-light'
                  }`}
                  title={displayName}
                >
                  <div className="truncate">
                    {searchTerm ? displayName : `${member.firstName} ${member.lastName}`}
                  </div>
                </button>
              );
            })}
            {(searchTerm ? filteredMembers : members).length > 6 && (
              <div className="text-xs text-gray-500 px-2 py-1">
                +{(searchTerm ? filteredMembers : members).length - 6} أخرى
              </div>
            )}
          </div>
          
          {/* Search Results Count */}
          {searchTerm && (
            <div className="text-xs text-gray-500 mt-2">
              {filteredMembers.length} نتيجة من أصل {members.length} شخص
            </div>
          )}
        </div>
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
                showMalesOnly ? undefined : () => onAddMember('mother', currentCenter.id),
                showMalesOnly && !family.mother
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
                showMalesOnly ? undefined : () => onAddMember('spouse', currentCenter.id),
                showMalesOnly && !family.spouse
              )}
            </div>
            <div className="text-center">
              <div className="text-xs text-heritage-brown mb-2 font-semibold">
                {linkedProfile && currentCenter.id === linkedProfile.id ? 'أنت' : 'المركز'}
              </div>
              {renderPersonCard(currentCenter, 'أنت', 'lg')}
            </div>
          </div>

          {/* Children */}
          {(family.children.length > 0 || true) && (
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">الأبناء</div>
              <div className="flex justify-center gap-4">
                {family.displayChildren.map((child) => (
                  <div key={child.id}>
                    {renderPersonCard(child, 'ابن/ابنة', 'sm')}
                  </div>
                ))}
                {family.children.length === 0 && (
                  renderPersonCard(
                    null,
                    'إضافة ابن',
                    'sm',
                    () => onAddMember('child', currentCenter.id)
                  )
                )}
                {family.children.length > 0 && family.children.length < 3 && (
                  renderPersonCard(
                    null,
                    'إضافة ابن',
                    'sm',
                    () => onAddMember('child', currentCenter.id)
                  )
                )}
              </div>
              {family.children.length > 3 && !showAllChildren && (
                <Button
                  onClick={() => setShowAllChildren(true)}
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                >
                  عرض جميع الأبناء ({family.children.length})
                </Button>
              )}
              {family.children.length > 3 && showAllChildren && (
                <Button
                  onClick={() => setShowAllChildren(false)}
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                >
                  عرض أقل
                </Button>
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
              <div className="text-center">
                <div className="text-sm font-medium text-heritage-brown mb-2">الأشقاء</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {family.displaySiblings.map((sibling) => (
                    <div key={sibling.id} className="transform scale-90">
                      {renderPersonCard(sibling, 'شقيق', 'sm')}
                    </div>
                  ))}
                </div>
                {family.siblings.length > 3 && !showAllSiblings && (
                  <Button
                    onClick={() => setShowAllSiblings(true)}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                  >
                    عرض جميع الأشقاء ({family.siblings.length})
                  </Button>
                )}
                {family.siblings.length > 3 && showAllSiblings && (
                  <Button
                    onClick={() => setShowAllSiblings(false)}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                  >
                    عرض أقل
                  </Button>
                )}
              </div>
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