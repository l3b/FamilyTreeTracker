import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Users, Link, Unlink, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ProfileLinkingProps {
  currentUser: any;
  familyMembers: any[];
}

export default function ProfileLinking({ currentUser, familyMembers }: ProfileLinkingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get currently linked profile
  const { data: linkedProfile } = useQuery({
    queryKey: ["/api/auth/linked-profile"],
    retry: false,
  });

  // Link profile mutation
  const linkProfileMutation = useMutation({
    mutationFn: async (familyMemberId: number) => {
      return await apiRequest(`/api/auth/link-profile/${familyMemberId}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/linked-profile"] });
      setIsOpen(false);
      toast({
        title: "تم ربط الملف الشخصي بنجاح",
        description: "تم ربط حسابك بالملف الشخصي المختار",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في ربط الملف الشخصي",
        description: error.message || "فشل في ربط الملف الشخصي",
        variant: "destructive",
      });
    },
  });

  // Unlink profile mutation
  const unlinkProfileMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/auth/unlink-profile", {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/linked-profile"] });
      toast({
        title: "تم إلغاء ربط الملف الشخصي",
        description: "تم إلغاء ربط حسابك من الملف الشخصي",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إلغاء ربط الملف الشخصي",
        description: error.message || "فشل في إلغاء ربط الملف الشخصي",
        variant: "destructive",
      });
    },
  });

  // Filter available family members (exclude those already linked to other users)
  const availableMembers = familyMembers.filter(member => 
    member.userId === currentUser.id || !member.userId
  );

  // Function to format name display
  const formatDisplayName = (member: any) => {
    if (member.arabicName) {
      return member.arabicName;
    }
    
    // Build Arabic-style name from components
    const firstName = member.firstName || '';
    const fatherName = member.fatherName || '';
    const lastName = member.lastName || '';
    
    if (firstName && fatherName) {
      return `${firstName} بن ${fatherName}${lastName ? ` ${lastName}` : ''}`;
    } else if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    }
    
    return 'غير محدد';
  };

  // Smart Arabic name search function
  const searchMembers = useMemo(() => {
    if (!searchQuery.trim()) return availableMembers;

    const query = searchQuery.trim().toLowerCase();
    
    return availableMembers.filter(member => {
      // Get all possible name variations
      const arabicName = member.arabicName || '';
      const firstName = member.firstName || '';
      const lastName = member.lastName || '';
      const fatherName = member.fatherName || '';
      const fullEnglishName = `${firstName} ${lastName}`.trim();
      
      // Create all possible searchable text combinations
      const searchableTexts = [
        // Original names
        arabicName,
        firstName,
        lastName,
        fatherName,
        fullEnglishName,
        
        // Arabic name variations (remove بن and normalize spaces)
        arabicName.replace(/\s+بن\s+/g, ' '),
        arabicName.replace(/\s+/g, ' ').trim(),
        arabicName.replace(/بن/g, '').replace(/\s+/g, ' ').trim(),
        
        // Common Arabic name combinations
        `${firstName} ${fatherName}`.trim(),
        `${firstName} بن ${fatherName}`.trim(),
        `${firstName} ${fatherName} ${lastName}`.trim(),
        `${firstName} بن ${fatherName} ${lastName}`.trim(),
        
        // Name parts without connectors
        `${firstName} ${fatherName} ${lastName}`.replace(/\s+/g, ' ').trim(),
        
        // Reverse order combinations (father first)
        `${fatherName} ${firstName}`.trim(),
        
        // Full name constructions
        formatDisplayName(member),
        formatDisplayName(member).replace(/\s+بن\s+/g, ' '),
        
      ].filter(text => text && text.length > 0);

      // Normalize query by removing extra spaces and بن
      const normalizedQuery = query.replace(/\s+بن\s+/g, ' ').replace(/\s+/g, ' ').trim();
      const queryWithoutBin = query.replace(/بن/g, '').replace(/\s+/g, ' ').trim();

      // Check if query matches any of the searchable texts
      return searchableTexts.some(text => {
        if (!text) return false;
        
        const normalizedText = text.toLowerCase().trim();
        
        // Direct substring match (most common case)
        if (normalizedText.includes(query)) return true;
        if (normalizedText.includes(normalizedQuery)) return true;
        if (normalizedText.includes(queryWithoutBin)) return true;
        
        // Remove بن from text and try again
        const textWithoutBin = normalizedText.replace(/بن/g, '').replace(/\s+/g, ' ').trim();
        if (textWithoutBin.includes(query)) return true;
        if (textWithoutBin.includes(normalizedQuery)) return true;
        if (textWithoutBin.includes(queryWithoutBin)) return true;
        
        // Split into words and check for partial matches
        const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 1);
        const textWords = normalizedText.split(/\s+/).filter(word => word.length > 1);
        
        if (queryWords.length === 0) return false;
        
        // Check if all query words are found in the text (partial matching)
        const allWordsFound = queryWords.every(queryWord => 
          textWords.some(textWord => 
            textWord.includes(queryWord) || queryWord.includes(textWord)
          )
        );
        
        if (allWordsFound) return true;
        
        // Try without بن in words
        const queryWordsNoBin = queryWithoutBin.split(/\s+/).filter(word => word.length > 1);
        const textWordsNoBin = textWithoutBin.split(/\s+/).filter(word => word.length > 1);
        
        return queryWordsNoBin.every(queryWord => 
          textWordsNoBin.some(textWord => 
            textWord.includes(queryWord) || queryWord.includes(textWord)
          )
        );
      });
    });
  }, [availableMembers, searchQuery]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          ربط الملف الشخصي
        </CardTitle>
        <CardDescription>
          اربط حسابك بأحد أفراد العائلة لتخصيص تجربتك
        </CardDescription>
      </CardHeader>
      <CardContent>
        {linkedProfile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={linkedProfile.profileImageUrl || linkedProfile.profileImage || 
                    (linkedProfile.gender === 'female' || linkedProfile.gender === 'أنثى' ? 
                      '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg')} 
                />
                <AvatarFallback>
                  {(linkedProfile.arabicName || linkedProfile.firstName || '').charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {formatDisplayName(linkedProfile)}
                </p>
                <p className="text-sm text-muted-foreground">
                  مرتبط بحسابك
                </p>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Link className="h-3 w-3" />
                مرتبط
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => unlinkProfileMutation.mutate()}
              disabled={unlinkProfileMutation.isPending}
              className="gap-2"
            >
              <Unlink className="h-4 w-4" />
              إلغاء الربط
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              لم يتم ربط حسابك بأي فرد من أفراد العائلة
            </p>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Link className="h-4 w-4" />
                  ربط الملف الشخصي
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>اختيار الملف الشخصي للربط</DialogTitle>
                  <DialogDescription>
                    اختر الشخص الذي يمثلك في شجرة العائلة
                  </DialogDescription>
                </DialogHeader>
                
                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالاسم الكامل أو جزء منه... (مثال: عبدالله عادل، أو عبدالله بن عادل، أو عبدالله عادل محمد)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                    dir="rtl"
                  />
                </div>

                {/* Results Count */}
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mb-4">
                    تم العثور على {searchMembers.length} من أصل {availableMembers.length} عضو
                  </p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {searchMembers.map((member) => (
                    <Card
                      key={member.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => linkProfileMutation.mutate(member.id)}
                    >
                      <CardContent className="flex items-center gap-3 p-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={member.profileImageUrl || member.profileImage || 
                              (member.gender === 'female' || member.gender === 'أنثى' ? 
                                '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg')} 
                          />
                          <AvatarFallback>
                            {(member.arabicName || member.firstName || '').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {formatDisplayName(member)}
                          </p>
                          {member.birthDate && (
                            <p className="text-sm text-muted-foreground">
                              مولود في {new Date(member.birthDate).getFullYear()}
                            </p>
                          )}
                          {member.occupation && (
                            <p className="text-xs text-muted-foreground">
                              {member.occupation}
                            </p>
                          )}
                        </div>
                        {member.userId === currentUser.id && (
                          <Badge variant="secondary" className="text-xs">
                            ملفك
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {searchMembers.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      لم يتم العثور على أي نتائج تطابق البحث "{searchQuery}"
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      جرب البحث باستخدام الاسم الأول أو اسم الأب فقط
                    </p>
                  </div>
                )}

                {availableMembers.length === 0 && !searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      لا توجد ملفات شخصية متاحة للربط
                    </p>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}