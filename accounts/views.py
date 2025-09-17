from rest_framework import generics, permissions, status
from django.contrib.auth.models import User
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from elections.models import UserProfile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    date_of_birth = serializers.DateField(required=True, write_only=True)
    class Meta:
        model = User
        fields = ('username', 'password', 'email', 'phone', 'over_18')
    def validate_date_of_birth(self, value):
        today = datetime.date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError("You must be at least 18 years old to register.")
        return value

    def create(self, validated_data):
        # Remove phone and date_of_birth from validated_data as they're not User model fields
        phone = validated_data.pop('phone', '')
        date_of_birth = validated_data.pop('date_of_birth')
        
        # Create the user - the post_save signal will handle profile creation
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data.get('email', '')
        )
        
        # Update the profile with phone and date_of_birth if provided
        if hasattr(user, 'profile'):
            if phone:
                user.profile.phone = phone
            user.profile.date_of_birth = date_of_birth
            user.profile.save()
        
        return user

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Return success response with user data
        return Response({
            'success': True,
            'message': 'Registration successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        }, status=status.HTTP_201_CREATED)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = TokenObtainPairSerializer

class UserDetailsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={'role': 'admin' if user.is_superuser else 'voter'}
        )
        
        # If profile already existed but role wasn't set for admin users
        if not created and user.is_superuser and not profile.role == 'admin':
            profile.role = 'admin'
            profile.save()
            
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': profile.role,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        })
