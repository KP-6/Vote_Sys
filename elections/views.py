from rest_framework import generics, permissions, status, mixins, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Election, Candidate, Vote, UserProfile, ElectionLog
from django.contrib.auth import get_user_model
from .serializers import (
    ElectionSerializer, ElectionDetailSerializer, VoteSerializer, 
    MyVoteSerializer, ResultSerializer, AdminElectionSerializer,
    AdminCandidateSerializer
)
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.utils import timezone
from django.shortcuts import get_object_or_404

class ElectionListView(generics.ListAPIView):
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer
    permission_classes = [permissions.AllowAny]

class ElectionDetailView(generics.RetrieveAPIView):
    queryset = Election.objects.all()
    serializer_class = ElectionDetailSerializer
    permission_classes = [permissions.AllowAny]

class VoteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Get the election and candidate IDs from the request
            election_id = request.data.get('election')
            candidate_id = request.data.get('candidate')
            
            if not election_id or not candidate_id:
                return Response(
                    {'detail': 'Election and candidate are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get the actual objects
            try:
                election = Election.objects.get(pk=election_id)
                candidate = Candidate.objects.get(pk=candidate_id)
            except (Election.DoesNotExist, Candidate.DoesNotExist):
                return Response(
                    {'detail': 'Invalid election or candidate'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user has already voted in this election
            if Vote.objects.filter(voter=request.user, election=election).exists():
                return Response(
                    {'detail': 'You have already voted in this election'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if election is active
            now = timezone.now()
            if not (election.start_time <= now <= election.end_time):
                return Response(
                    {'detail': 'Election is not active'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if candidate belongs to the election
            if candidate.election_id != election.id:
                return Response(
                    {'detail': 'Invalid candidate for this election'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the vote
            vote = Vote.objects.create(
                voter=request.user,
                election=election,
                candidate=candidate,
                rank=1  # Default rank for single-choice
            )
            
            # Log the vote
            ElectionLog.objects.create(
                election=election,
                user=request.user,
                action='vote_cast',
                details=f'Voted for {candidate.name}'
            )
            
            return Response(
                {'detail': 'Vote cast successfully', 'vote_id': vote.id},
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class MyVotesView(generics.ListAPIView):
    serializer_class = MyVoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Vote.objects.filter(voter=self.request.user)

class ResultsView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request, election_id):
        try:
            election = Election.objects.get(pk=election_id)
        except Election.DoesNotExist:
            return Response({'detail': 'Election not found.'}, status=404)
        # Return live results even before the election ends
        # If you need to lock results until the end, reintroduce the check below:
        # if timezone.now() < election.end_time:
        #     return Response({'detail': 'Results are locked until the election ends.'}, status=403)
        serializer = ResultSerializer(election)
        return Response(serializer.data)


class AdminElectionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for admin election management.
    """
    serializer_class = AdminElectionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only allow admins to manage elections
        if not hasattr(self.request.user, 'profile') or self.request.user.profile.role != 'admin':
            raise PermissionDenied("You do not have permission to perform this action.")
        return Election.objects.all().order_by('-created_at')
    
    def perform_create(self, serializer):
        # Set the created_by field to the current user
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def launch(self, request, pk=None):
        """
        Launch/activate an election.
        """
        election = self.get_object()
        
        # Check if user is admin
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
            raise PermissionDenied("You do not have permission to launch elections.")
        
        # Validate that election has at least one candidate
        if not election.candidates.exists():
            return Response(
                {'detail': 'Cannot launch an election without at least one candidate.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate that end time is in the future
        if election.end_time <= timezone.now():
            return Response(
                {'detail': 'Cannot launch an election with an end time in the past.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Activate the election
        election.is_active = True
        election.save()
        
        return Response(
            {'detail': 'Election launched successfully.'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """
        Close/deactivate an election.
        """
        election = self.get_object()
        
        # Check if user is admin
        if not hasattr(request.user, 'profile') or request.user.profile.role != 'admin':
            raise PermissionDenied("You do not have permission to close elections.")
        
        # Deactivate the election
        election.is_active = False
        election.save()
        
        return Response(
            {'detail': 'Election closed successfully.'},
            status=status.HTTP_200_OK
        )
