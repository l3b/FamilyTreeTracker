import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Calendar, MapPin, Briefcase, User, Users, FileText, Image as ImageIcon, Edit, Phone, Mail, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DocumentCard from "@/components/DocumentCard";
import PhotoCard from "@/components/PhotoCard";
import EditMemberForm from "@/components/EditMemberForm";

export default function MemberProfile() {
  const { id } = useParams();
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: [`/api/family-members/${id}`],
    enabled: !!id,
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ["/api/family-members"],
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["/api/family-documents"],
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["/api/family-photos"],
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">لم يتم العثور على العضو</p>
              <Link href="/family-tree">
                <Button className="mt-4">العودة إلى شجرة العائلة</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Build father chain
  const buildFatherChain = (person: any): { chain: any[], arabicChain: string } => {
    const chain = [person];
    let current = person;
    let arabicNames = [person.arabicName || person.firstName];
    
    while (current.fatherId) {
      const father = allMembers.find((m: any) => m.id === current.fatherId);
      if (father) {
        chain.push(father);
        arabicNames.push(father.arabicName || father.firstName);
        current = father;
      } else {
        break;
      }
    }
    
    return {
      chain,
      arabicChain: arabicNames.join(" بن ")
    };
  };

  const { chain: fatherChain, arabicChain } = buildFatherChain(member);

  // Get related family members
  const children = allMembers.filter((m: any) => m.fatherId === member.id || m.motherId === member.id);
  const siblings = allMembers.filter((m: any) => 
    m.id !== member.id && 
    ((member.fatherId && m.fatherId === member.fatherId) || 
     (member.motherId && m.motherId === member.motherId))
  );

  // Check if user can edit this profile
  const canEdit = currentUser && (
    currentUser.isAdmin || 
    currentUser.isSuperAdmin || 
    member.userId === currentUser.id
  );
  
  const father = member.fatherId ? allMembers.find((m: any) => m.id === member.fatherId) : null;
  const mother = member.motherId ? allMembers.find((m: any) => m.id === member.motherId) : null;
  const spouse = member.spouseId ? allMembers.find((m: any) => m.id === member.spouseId) : null;

  // Get member's documents and photos
  const memberDocuments = documents.filter((doc: any) => doc.familyMemberId === member.id);
  const memberPhotos = photos.filter((photo: any) => photo.familyMemberId === member.id);

  // Default profile image based on gender - check both profileImageUrl fields for compatibility
  const profileImage = member.profileImageUrl || member.profileImage || 
    (member.gender === 'female' || member.gender === 'أنثى' ? '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-muted">
                  <img 
                    src={profileImage} 
                    alt={member.arabicName || member.firstName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div className="space-y-1">
                    <h1 className="text-3xl font-bold">
                      {member.arabicName || `${member.firstName} ${member.lastName || ''}`}
                    </h1>
                    {member.laqab && (
                      <p className="text-lg text-muted-foreground">{member.laqab}</p>
                    )}
                    {member.kunya && (
                      <p className="text-md text-muted-foreground italic">{member.kunya}</p>
                    )}
                    {member.arabicName && (
                      <p className="text-sm text-muted-foreground">
                        {member.firstName} {member.lastName || ''}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      تحرير
                    </Button>
                  )}
                </div>
                
                {/* Father Chain */}
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                    {fatherChain.map((ancestor, index) => (
                      <div key={ancestor.id} className="flex items-center">
                        {index > 0 && <span className="mx-2">بن</span>}
                        {ancestor.id === member.id ? (
                          <span className="font-medium text-foreground">
                            {ancestor.arabicName || ancestor.firstName}
                          </span>
                        ) : (
                          <div 
                            onClick={() => window.location.href = `/member/${ancestor.id}`}
                            className="hover:text-primary hover:underline cursor-pointer"
                          >
                            {ancestor.arabicName || ancestor.firstName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {member.birthDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>ولد في {format(new Date(member.birthDate), "d MMMM yyyy", { locale: ar })}</span>
                    </div>
                  )}
                  {member.birthPlace && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span>مكان الميلاد: {member.birthPlace}</span>
                    </div>
                  )}
                  {member.currentLocation && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>مكان الإقامة: {member.currentLocation}</span>
                    </div>
                  )}
                  {member.occupation && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{member.occupation}</span>
                    </div>
                  )}
                  {member.education && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{member.education}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span dir="ltr">{member.phone}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span dir="ltr">{member.email}</span>
                    </div>
                  )}
                  {member.socialMedia && member.socialMedia.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">وسائل التواصل:</span>
                      {member.socialMedia.map((social: any, index: number) => (
                        <a
                          key={index}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          {social.platform}
                        </a>
                      ))}
                    </div>
                  )}
                  {member.deathDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>توفي في {format(new Date(member.deathDate), "d MMMM yyyy", { locale: ar })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="family" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="family">العائلة</TabsTrigger>
            <TabsTrigger value="documents">الوثائق</TabsTrigger>
            <TabsTrigger value="photos">الصور</TabsTrigger>
            <TabsTrigger value="details">التفاصيل</TabsTrigger>
          </TabsList>

          <TabsContent value="family" className="space-y-4">
            {/* Parents */}
            {(father || mother) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    الوالدان
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {father && (
                      <div 
                        onClick={() => window.location.href = `/member/${father.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                          <img 
                            src={father.profileImageUrl || father.profileImage || '/arabic-male-silhouette.svg'} 
                            alt={father.arabicName || father.firstName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{father.arabicName || father.firstName}</p>
                          <p className="text-sm text-muted-foreground">الأب</p>
                        </div>
                      </div>
                    )}
                    {mother && (
                      <div 
                        onClick={() => window.location.href = `/member/${mother.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                          <img 
                            src={mother.profileImageUrl || mother.profileImage || '/arabic-female-silhouette.svg'} 
                            alt={mother.arabicName || mother.firstName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{mother.arabicName || mother.firstName}</p>
                          <p className="text-sm text-muted-foreground">الأم</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Spouse */}
            {spouse && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    الزوج/الزوجة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    onClick={() => window.location.href = `/member/${spouse.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                      <img 
                        src={spouse.profileImageUrl || spouse.profileImage || (spouse.gender === 'female' || spouse.gender === 'أنثى' ? '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg')} 
                        alt={spouse.arabicName || spouse.firstName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{spouse.arabicName || spouse.firstName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Children */}
            {children.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    الأبناء ({children.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {children.map((child: any) => (
                      <div 
                        key={child.id} 
                        onClick={() => window.location.href = `/member/${child.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                          <img 
                            src={child.profileImageUrl || child.profileImage || (child.gender === 'female' || child.gender === 'أنثى' ? '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg')} 
                            alt={child.arabicName || child.firstName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{child.arabicName || child.firstName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Siblings */}
            {siblings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    الإخوة والأخوات ({siblings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {siblings.map((sibling: any) => (
                      <div 
                        key={sibling.id} 
                        onClick={() => window.location.href = `/member/${sibling.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                          <img 
                            src={sibling.profileImage || (sibling.gender === 'female' ? '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg')} 
                            alt={sibling.arabicName || sibling.firstName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{sibling.arabicName || sibling.firstName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  الوثائق ({memberDocuments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {memberDocuments.map((doc: any) => (
                      <DocumentCard key={doc.id} document={doc} compact />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">لا توجد وثائق مرتبطة بهذا العضو</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  الصور ({memberPhotos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {memberPhotos.map((photo: any) => (
                      <PhotoCard key={photo.id} photo={photo} compact />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">لا توجد صور مرتبطة بهذا العضو</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>معلومات تفصيلية</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="font-medium text-muted-foreground">الاسم الكامل (عربي)</dt>
                    <dd>{member.arabicName || '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">الاسم الكامل (إنجليزي)</dt>
                    <dd>{member.firstName} {member.lastName || ''}</dd>
                  </div>
                  {member.laqab && (
                    <div>
                      <dt className="font-medium text-muted-foreground">اللقب</dt>
                      <dd>{member.laqab}</dd>
                    </div>
                  )}
                  {member.kunya && (
                    <div>
                      <dt className="font-medium text-muted-foreground">الكنية</dt>
                      <dd>{member.kunya}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="font-medium text-muted-foreground">الجنس</dt>
                    <dd>{member.gender || '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">تاريخ الميلاد</dt>
                    <dd>{member.birthDate ? format(new Date(member.birthDate), "d MMMM yyyy", { locale: ar }) : '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">مكان الميلاد</dt>
                    <dd>{member.birthPlace || '-'}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">المهنة</dt>
                    <dd>{member.occupation || '-'}</dd>
                  </div>
                  {member.education && (
                    <div>
                      <dt className="font-medium text-muted-foreground">التعليم</dt>
                      <dd>{member.education}</dd>
                    </div>
                  )}
                  {member.phone && (
                    <div>
                      <dt className="font-medium text-muted-foreground">الهاتف</dt>
                      <dd dir="ltr">{member.phone}</dd>
                    </div>
                  )}
                  {member.email && (
                    <div>
                      <dt className="font-medium text-muted-foreground">البريد الإلكتروني</dt>
                      <dd dir="ltr">{member.email}</dd>
                    </div>
                  )}
                  {member.socialMedia && member.socialMedia.length > 0 && (
                    <div className="md:col-span-2">
                      <dt className="font-medium text-muted-foreground mb-2">وسائل التواصل الاجتماعي</dt>
                      <dd className="flex flex-wrap gap-2">
                        {member.socialMedia.map((social: any, index: number) => (
                          <a
                            key={index}
                            href={social.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm hover:bg-primary/20 transition-colors"
                          >
                            {social.platform}
                          </a>
                        ))}
                      </dd>
                    </div>
                  )}
                  {member.marriageDate && (
                    <div>
                      <dt className="font-medium text-muted-foreground">تاريخ الزواج</dt>
                      <dd>{format(new Date(member.marriageDate), "d MMMM yyyy", { locale: ar })}</dd>
                    </div>
                  )}
                  {member.marriagePlace && (
                    <div>
                      <dt className="font-medium text-muted-foreground">مكان الزواج</dt>
                      <dd>{member.marriagePlace}</dd>
                    </div>
                  )}
                  {member.deathDate && (
                    <>
                      <div>
                        <dt className="font-medium text-muted-foreground">تاريخ الوفاة</dt>
                        <dd>{format(new Date(member.deathDate), "d MMMM yyyy", { locale: ar })}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">مكان الوفاة</dt>
                        <dd>{member.deathPlace || '-'}</dd>
                      </div>
                    </>
                  )}
                  {member.notes && (
                    <div className="md:col-span-2">
                      <dt className="font-medium text-muted-foreground mb-2">ملاحظات</dt>
                      <dd className="whitespace-pre-wrap">{member.notes}</dd>
                    </div>
                  )}
                  {member.gedcomId && (
                    <div>
                      <dt className="font-medium text-muted-foreground">معرف GEDCOM</dt>
                      <dd className="font-mono text-sm">{member.gedcomId}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Edit Member Form */}
      {member && (
        <EditMemberForm
          member={member}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}