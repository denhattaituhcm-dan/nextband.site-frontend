import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { authApi, uploadsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Camera, Save } from "lucide-react";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
      setPhone(user.phone || "");
      setGender(user.gender || "");
    }
  }, [user]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingInfo(true);
    try {
      await authApi.updateProfile({ fullName, bio, avatarUrl, phone, gender });
      await refreshUser();
      toast({
        title: "Cập nhật thành công",
        description: "Thông tin cá nhân của bạn đã được cập nhật.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.error || "Không thể cập nhật thông tin.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const response = await uploadsApi.uploadImage(file);
      setAvatarUrl(response.url);
      await authApi.updateProfile({ avatarUrl: response.url });
      await refreshUser();
      toast({
        title: "Tải ảnh lên thành công",
        description: "Ảnh đại diện của bạn đã được cập nhật và lưu thành công.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tải ảnh lên.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cá Nhân</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin cá nhân và cài đặt tài khoản của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block">
                <Avatar className="h-32 w-32 mx-auto border-2 border-primary/10">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-4xl bg-muted">
                    <User className="h-16 w-16 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0">
                  <Label
                    htmlFor="avatar-upload"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold">{user?.fullName || "Học viên"}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-8">
          {/* Personal Info */}
          <Card>
            <form onSubmit={handleUpdateInfo}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" /> Thông tin cá nhân
                </CardTitle>
                <CardDescription>
                  Cập nhật họ tên và giới thiệu bản thân của bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Họ và tên</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên của bạn"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Số điện thoại</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="VD: 09xxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Giới tính</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Nam</SelectItem>
                        <SelectItem value="female">Nữ</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Giới thiệu</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Một chút về bản thân bạn..."
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t pt-6">
                <Button type="submit" disabled={isUpdatingInfo}>
                  {isUpdatingInfo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Lưu thông tin
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

