from django.http import JsonResponse
from .matchmaker import RedisMatchmaker

def status_view(request):
    """
    Public health check & metrics endpoint returning current online users count.
    """
    count = RedisMatchmaker.get_online_count()
    return JsonResponse({
        'status': 'online',
        'active_users': count
    })
