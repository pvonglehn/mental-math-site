from django.urls import path, include, re_path
from . import views
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'question', views.QuestionViewSet)

app_name = 'exercises'

urlpatterns = [
    path('submit_answer', views.submit_answer, name='submit_answer'),
    path('api', include(router.urls)),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('', views.index, name='index'),
    path('set_targets', views.set_targets, name='set_targets'),
    path('submit_targets', views.submit_targets, name='submit_targets'),
    path('statistics', views.statistics, name='statistics'),
    path('get_daily_stats', views.get_daily_stats, name='get_daily_stats'),     
    re_path(r'^signup/$', views.signup, name='signup'),
]
    