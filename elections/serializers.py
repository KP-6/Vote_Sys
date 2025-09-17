from rest_framework import serializers
from .models import Election, Candidate, Vote, UserProfile
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.utils import timezone

class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'name']

class AdminCandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = ['id', 'name', 'description', 'position', 'order', 'is_active']
        read_only_fields = ['id']

class ElectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Election
        fields = ['id', 'name', 'description', 'start_time', 'end_time', 'voting_start_time', 'voting_end_time']

class AdminElectionSerializer(serializers.ModelSerializer):
    candidates = AdminCandidateSerializer(many=True, required=False)
    created_by = serializers.PrimaryKeyRelatedField(queryset=get_user_model().objects.filter(profile__role='admin'), required=False)
    
    class Meta:
        model = Election
        fields = [
            'id', 'name', 'description', 'election_type', 'visibility',
            'start_time', 'end_time', 'voting_start_time', 'voting_end_time',
            'max_votes_per_voter', 'require_confirmation', 'is_active',
            'candidates', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        if 'start_time' in data and 'end_time' in data and data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("End time must be after start time.")
        if 'voting_start_time' in data and 'voting_end_time' in data:
            if data['voting_start_time'] >= data['voting_end_time']:
                raise serializers.ValidationError("Voting end time must be after voting start time.")
        return data
    
    def create(self, validated_data):
        candidates_data = validated_data.pop('candidates', [])
        election = Election.objects.create(**validated_data)
        
        for candidate_data in candidates_data:
            Candidate.objects.create(election=election, **candidate_data)
            
        return election
    
    def update(self, instance, validated_data):
        candidates_data = validated_data.pop('candidates', None)
        
        # Update election fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update or create candidates if provided
        if candidates_data is not None:
            # Get existing candidate IDs
            existing_candidate_ids = set(instance.candidates.values_list('id', flat=True))
            updated_candidate_ids = set()
            
            # Update or create candidates
            for candidate_data in candidates_data:
                candidate_id = candidate_data.get('id')
                if candidate_id and instance.candidates.filter(id=candidate_id).exists():
                    # Update existing candidate
                    Candidate.objects.filter(id=candidate_id).update(**candidate_data)
                    updated_candidate_ids.add(candidate_id)
                else:
                    # Create new candidate
                    if 'id' in candidate_data:
                        candidate_data.pop('id')
                    Candidate.objects.create(election=instance, **candidate_data)
            
            # Delete candidates that were not included in the update
            instance.candidates.exclude(id__in=updated_candidate_ids).delete()
            
        return instance


class ElectionDetailSerializer(serializers.ModelSerializer):
    candidates = CandidateSerializer(many=True, read_only=True)
    class Meta:
        model = Election
        fields = ['id', 'name', 'description', 'start_time', 'end_time', 'voting_start_time', 'voting_end_time', 'candidates']

class VoteSerializer(serializers.ModelSerializer):
    candidate = serializers.PrimaryKeyRelatedField(queryset=Candidate.objects.all())
    election = serializers.PrimaryKeyRelatedField(queryset=Election.objects.all())
    
    class Meta:
        model = Vote
        fields = ['election', 'candidate', 'rank']
        extra_kwargs = {
            'rank': {'required': False, 'default': 1}  # Default rank is 1 for single-choice
        }
    def validate(self, data):
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        
        if not user or not user.is_authenticated:
            raise serializers.ValidationError('Authentication required to vote.')
            
        election = data.get('election')
        candidate = data.get('candidate')
        
        if not election or not candidate:
            raise serializers.ValidationError('Election and candidate are required.')
            
        # Check if candidate belongs to the election
        if candidate.election_id != election.id:
            raise serializers.ValidationError('Invalid candidate for this election.')
            
        # Check if user has already voted in this election
        if Vote.objects.filter(voter=user, election=election).exists():
            raise serializers.ValidationError('You have already voted in this election.')
            
        # Check if election is active
        now = timezone.now()
        if not (election.start_time <= now <= election.end_time):
            raise serializers.ValidationError('Election is not active.')
            
        # Enforce daily voting time window
        now_local = timezone.localtime(now)
        now_time = now_local.time()
        start_t = election.voting_start_time
        end_t = election.voting_end_time
        
        within_window = False
        if start_t <= end_t:
            within_window = (start_t <= now_time <= end_t)
        else:
            # Window crosses midnight (e.g., 22:00 - 02:00)
            within_window = (now_time >= start_t or now_time <= end_t)
            
        if not within_window:
            raise serializers.ValidationError('Voting is closed at this time of day.')
            
        # For ranked choice, ensure rank is provided
        if election.election_type == 'ranked_choice' and 'rank' not in data:
            raise serializers.ValidationError('Rank is required for ranked choice elections.')
            
        return data
    def create(self, validated_data):
        return Vote.objects.create(**validated_data)

class MyVoteSerializer(serializers.ModelSerializer):
    election = ElectionSerializer()
    candidate = CandidateSerializer()
    class Meta:
        model = Vote
        fields = ['election', 'candidate', 'timestamp']

class ResultSerializer(serializers.ModelSerializer):
    candidates = serializers.SerializerMethodField()
    class Meta:
        model = Election
        fields = ['id', 'name', 'candidates']
    def get_candidates(self, obj):
        results = []
        for candidate in obj.candidates.all():
            count = Vote.objects.filter(election=obj, candidate=candidate).count()
            results.append({'id': candidate.id, 'name': candidate.name, 'votes': count})
        return results