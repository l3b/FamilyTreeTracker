interface FamilyTreeViewProps {
  members: any[];
  onDeleteMember: (id: number) => void;
}

export default function FamilyTreeView({ members, onDeleteMember }: FamilyTreeViewProps) {
  if (members.length === 0) {
    return null;
  }

  // Simple tree visualization - in a real app, you'd want a more sophisticated tree layout algorithm
  const organizeMembers = () => {
    const organized: { [key: string]: any[] } = {
      grandparents: [],
      parents: [],
      children: [],
      others: [],
    };

    members.forEach((member) => {
      const birthYear = member.birthDate ? new Date(member.birthDate).getFullYear() : 0;
      
      if (birthYear && birthYear < 1950) {
        organized.grandparents.push(member);
      } else if (birthYear && birthYear < 1980) {
        organized.parents.push(member);
      } else if (birthYear && birthYear >= 1980) {
        organized.children.push(member);
      } else {
        organized.others.push(member);
      }
    });

    return organized;
  };

  const organizedMembers = organizeMembers();

  const renderMemberCard = (member: any, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-12 h-12 text-xs",
      md: "w-16 h-16 text-sm",
      lg: "w-20 h-20 text-base",
    };

    return (
      <div key={member.id} className="text-center group relative">
        <div className={`${sizeClasses[size]} rounded-full bg-heritage-brown text-white flex items-center justify-center mx-auto mb-2 border-2 border-heritage-brown relative`}>
          {member.profileImageUrl ? (
            <img
              src={member.profileImageUrl}
              alt={member.firstName}
              className={`${sizeClasses[size]} rounded-full object-cover`}
            />
          ) : (
            <i className="fas fa-user"></i>
          )}
          
          {/* Delete button - appears on hover */}
          <button
            onClick={() => onDeleteMember(member.id)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="text-sm font-medium text-heritage-dark">
          {member.firstName} {member.lastName}
        </div>
        {member.arabicName && (
          <div className="text-xs text-gray-500">{member.arabicName}</div>
        )}
        {member.birthDate && (
          <div className="text-xs text-gray-500">
            {new Date(member.birthDate).getFullYear()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="family-tree-container overflow-x-auto">
      <div className="min-w-full p-4">
        {/* Grandparents Level */}
        {organizedMembers.grandparents.length > 0 && (
          <>
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-heritage-brown mb-4">الأجداد</h4>
              <div className="flex justify-center space-x-8 space-x-reverse">
                {organizedMembers.grandparents.map((member) => renderMemberCard(member, "lg"))}
              </div>
            </div>

            {/* Connecting Line */}
            {organizedMembers.parents.length > 0 && (
              <div className="flex justify-center mb-4">
                <div className="w-32 h-4 family-tree-connector"></div>
              </div>
            )}
          </>
        )}

        {/* Parents Level */}
        {organizedMembers.parents.length > 0 && (
          <>
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-heritage-brown mb-4">الوالدان</h4>
              <div className="flex justify-center space-x-8 space-x-reverse">
                {organizedMembers.parents.map((member) => renderMemberCard(member, "md"))}
              </div>
            </div>

            {/* Connecting Line */}
            {organizedMembers.children.length > 0 && (
              <div className="flex justify-center mb-4">
                <div className="w-24 h-4 family-tree-connector"></div>
              </div>
            )}
          </>
        )}

        {/* Children Level */}
        {organizedMembers.children.length > 0 && (
          <div className="text-center mb-4">
            <h4 className="text-lg font-semibold text-heritage-brown mb-4">الأبناء</h4>
            <div className="flex justify-center space-x-6 space-x-reverse flex-wrap gap-4">
              {organizedMembers.children.map((member) => renderMemberCard(member, "sm"))}
            </div>
          </div>
        )}

        {/* Others */}
        {organizedMembers.others.length > 0 && (
          <div className="text-center mt-8">
            <h4 className="text-lg font-semibold text-heritage-brown mb-4">أفراد آخرون</h4>
            <div className="flex justify-center space-x-6 space-x-reverse flex-wrap gap-4">
              {organizedMembers.others.map((member) => renderMemberCard(member, "sm"))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
