import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, MapPin, Briefcase, User, Users, FileText, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DocumentCard from "@/components/DocumentCard";
import PhotoCard from "@/components/PhotoCard";

export default function MemberProfile() {
  const { id } = useParams();
  
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
  
  const father = member.fatherId ? allMembers.find((m: any) => m.id === member.fatherId) : null;
  const mother = member.motherId ? allMembers.find((m: any) => m.id === member.motherId) : null;
  const spouse = member.spouseId ? allMembers.find((m: any) => m.id === member.spouseId) : null;

  // Get member's documents and photos
  const memberDocuments = documents.filter((doc: any) => doc.familyMemberId === member.id);
  const memberPhotos = photos.filter((photo: any) => photo.familyMemberId === member.id);

  // Default profile image based on gender
  const profileImage = member.profileImage || 
    (member.gender === 'female' ? '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg');

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
                <h1 className="text-3xl font-bold mb-2">{member.arabicName || member.firstName}</h1>
                
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
                          <Link href={`/member/${ancestor.id}`} className="hover:text-primary hover:underline">
                            {ancestor.arabicName || ancestor.firstName}
                          </Link>
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
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{member.birthPlace}</span>
                    </div>
                  )}
                  {member.occupation && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span>{member.occupation}</span>
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
                      <Link href={`/member/${father.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                          <img 
                            src={father.profileImage || '/arabic-male-silhouette.svg'} 
                            alt={father.arabicName || father.firstName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{father.arabicName || father.firstName}</p>
                          <p className="text-sm text-muted-foreground">الأب</p>
                        </div>
                      </Link>
                    )}
                    {mother && (
                      <Link href={`/member/${mother.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                          <img 
                            src={mother.profileImage || '/arabic-female-silhouette.svg'} 
                            alt={mother.arabicName || mother.firstName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{mother.arabicName || mother.firstName}</p>
                          <p className="text-sm text-muted-foreground">الأم</p>
                        </div>
                      </Link>
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
                  <Link href={`/member/${spouse.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                      <img 
                        src={spouse.profileImage || (spouse.gender === 'female' ? '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg')} 
                        alt={spouse.arabicName || spouse.firstName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{spouse.arabicName || spouse.firstName}</p>
                    </div>
                  </Link>
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
                      <Link key={child.id} href={`/member/${child.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                          <img 
                            src={child.profileImage || (child.gender === 'female' ? '/arabic-female-silhouette.svg' : '/arabic-male-silhouette.svg')} 
                            alt={child.arabicName || child.firstName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{child.arabicName || child.firstName}</p>
                        </div>
                      </Link>
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
                      <Link key={sibling.id} href={`/member/${sibling.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
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
                      </Link>
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
                  <div>
                    <dt className="font-medium text-muted-foreground">الجنس</dt>
                    <dd>{member.gender === 'male' ? 'ذكر' : member.gender === 'female' ? 'أنثى' : '-'}</dd>
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
                  {member.biography && (
                    <div className="md:col-span-2">
                      <dt className="font-medium text-muted-foreground mb-2">السيرة الذاتية</dt>
                      <dd className="whitespace-pre-wrap">{member.biography}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}