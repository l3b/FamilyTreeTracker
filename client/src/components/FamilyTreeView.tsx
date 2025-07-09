import { Link } from "wouter";

interface FamilyTreeViewProps {
  members: any[];
  onDeleteMember: (id: number) => void;
}

interface TreeNode {
  member: any;
  children: TreeNode[];
  spouse?: any;
  level: number;
}

export default function FamilyTreeView({ members, onDeleteMember }: FamilyTreeViewProps) {
  if (members.length === 0) {
    return null;
  }

  // Build family tree based on actual relationships and birth years
  const buildFamilyTree = () => {
    // Group members by generation based on birth year
    const generations: { [key: number]: any[] } = {};
    const memberMap = new Map();
    
    members.forEach(member => {
      memberMap.set(member.id, member);
      const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : null;
      
      let generation = 0;
      if (birthYear) {
        if (birthYear < 1940) generation = 0; // Great grandparents
        else if (birthYear < 1960) generation = 1; // Grandparents
        else if (birthYear < 1980) generation = 2; // Parents
        else if (birthYear < 2000) generation = 3; // Children
        else generation = 4; // Grandchildren
      } else {
        // Use notes or other clues to determine generation
        const notes = member.notes?.toLowerCase() || '';
        if (notes.includes('جد') || notes.includes('جدة')) generation = 1;
        else if (notes.includes('والد') || notes.includes('والدة')) generation = 2;
        else if (notes.includes('ابن') || notes.includes('ابنة')) generation = 3;
        else generation = 2; // Default to parent generation
      }
      
      if (!generations[generation]) generations[generation] = [];
      generations[generation].push(member);
    });

    return generations;
  };

  const generations = buildFamilyTree();

  const renderMemberCard = (member: any, generation: number) => {
    const sizeClasses = {
      0: "w-24 h-24 text-base", // Great grandparents
      1: "w-20 h-20 text-sm",   // Grandparents  
      2: "w-18 h-18 text-sm",   // Parents
      3: "w-16 h-16 text-xs",   // Children
      4: "w-14 h-14 text-xs",   // Grandchildren
    };

    const borderColors = {
      0: "border-amber-600 bg-amber-100",
      1: "border-heritage-brown bg-heritage-light", 
      2: "border-blue-600 bg-blue-100",
      3: "border-green-600 bg-green-100",
      4: "border-purple-600 bg-purple-100",
    };

    const size = sizeClasses[generation as keyof typeof sizeClasses] || sizeClasses[2];
    const colors = borderColors[generation as keyof typeof borderColors] || borderColors[2];

    return (
      <div key={member.id} className="flex flex-col items-center group relative mx-2">
        <div className={`${size} rounded-lg ${colors} border-2 flex items-center justify-center relative shadow-md hover:shadow-lg transition-shadow`}>
          {member.profileImageUrl ? (
            <img
              src={member.profileImageUrl}
              alt={member.firstName}
              className={`${size} rounded-lg object-cover`}
            />
          ) : (
            <div className="text-heritage-brown">
              <i className={`fas ${member.gender === 'ذكر' ? 'fa-male' : member.gender === 'أنثى' ? 'fa-female' : 'fa-user'}`}></i>
            </div>
          )}
          
          {/* Delete button */}
          <button
            onClick={() => onDeleteMember(member.id)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="mt-2 text-center min-w-[80px]">
          <Link href={`/member/${member.id}`} className="text-xs font-medium text-heritage-dark truncate hover:underline cursor-pointer block">
            {member.firstName} {member.lastName}
          </Link>
          {member.arabicName && member.arabicName !== `${member.firstName} ${member.lastName}` && (
            <div className="text-xs text-gray-500 truncate">{member.arabicName}</div>
          )}
          {member.birthDate && (
            <div className="text-xs text-gray-400">
              {new Date(member.birthDate).getFullYear()}
              {member.deathDate && ` - ${new Date(member.deathDate).getFullYear()}`}
            </div>
          )}
          {member.occupation && (
            <div className="text-xs text-blue-600 truncate">{member.occupation}</div>
          )}
        </div>
      </div>
    );
  };

  const renderConnections = (fromGeneration: number, toGeneration: number, fromCount: number, toCount: number) => {
    if (fromCount === 0 || toCount === 0) return null;
    
    return (
      <div className="flex justify-center items-center h-12 relative">
        <svg width="300" height="48" className="absolute">
          {/* Horizontal line from parent generation */}
          <line 
            x1="150" y1="0" 
            x2="150" y2="24" 
            stroke="#8B4513" 
            strokeWidth="2"
          />
          {/* Horizontal connector */}
          <line 
            x1="50" y1="24" 
            x2="250" y2="24" 
            stroke="#8B4513" 
            strokeWidth="2"
          />
          {/* Vertical lines to children */}
          {Array.from({ length: Math.min(toCount, 5) }, (_, i) => {
            const spacing = 200 / Math.max(toCount - 1, 1);
            const x = 50 + (i * spacing);
            return (
              <line 
                key={i}
                x1={x} y1="24" 
                x2={x} y2="48" 
                stroke="#8B4513" 
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const getGenerationTitle = (generation: number) => {
    const titles = {
      0: "الأجداد الكبار",
      1: "الأجداد", 
      2: "الوالدان",
      3: "الأبناء",
      4: "الأحفاد",
    };
    return titles[generation as keyof typeof titles] || "أفراد العائلة";
  };

  // Sort generations by key to display in order
  const sortedGenerations = Object.keys(generations)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="family-tree-container overflow-x-auto bg-gradient-to-b from-heritage-light to-white">
      <div className="min-w-full p-6">
        {sortedGenerations.map((generation, index) => (
          <div key={generation}>
            {/* Generation Title */}
            <div className="text-center mb-6">
              <h4 className="text-xl font-bold text-heritage-brown mb-2">
                {getGenerationTitle(generation)}
              </h4>
              <div className="w-24 h-0.5 bg-heritage-brown mx-auto"></div>
            </div>

            {/* Members Grid */}
            <div className="flex justify-center flex-wrap gap-6 mb-8">
              {generations[generation].map((member) => renderMemberCard(member, generation))}
            </div>

            {/* Connections to next generation */}
            {index < sortedGenerations.length - 1 && 
              renderConnections(
                generation, 
                sortedGenerations[index + 1], 
                generations[generation].length,
                generations[sortedGenerations[index + 1]].length
              )
            }
          </div>
        ))}

        {/* Family Statistics */}
        <div className="mt-8 text-center bg-white rounded-lg p-4 shadow-md">
          <h5 className="text-lg font-semibold text-heritage-brown mb-2">إحصائيات العائلة</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-heritage-brown">{members.length}</div>
              <div className="text-gray-600">إجمالي الأفراد</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{sortedGenerations.length}</div>
              <div className="text-gray-600">الأجيال</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {members.filter(m => m.gender === 'ذكر').length}
              </div>
              <div className="text-gray-600">ذكور</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {members.filter(m => m.gender === 'أنثى').length}
              </div>
              <div className="text-gray-600">إناث</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}