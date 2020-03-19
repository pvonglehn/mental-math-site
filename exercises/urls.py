from django.urls import path, include
from django.conf.urls import url
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
]