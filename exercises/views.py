from django.http import HttpResponse
from django.template import loader
from rest_framework import viewsets

from .serializers import QuestionSerializer
from .models import Question, Target

from django.utils import timezone

from django.views.decorators.http import require_http_methods

import pandas as pd
import numpy as np

def index(request):
    
    template = loader.get_template('exercises/index.html')

    context = dict()
    context["operator_name"] = request.GET.get("operator_name","addition")
    context["a_digits"] = request.GET.get("operator_name","a_digits")
    context["b_digits"] = request.GET.get("operator_name","b_digits")
    context = dict(request.GET)
    print(context)

    return HttpResponse(template.render(context, request))

@require_http_methods(["POST"])
def submit_answer(request):

    if request.method == 'POST':
        params = { k:v for k,v in request.POST.items() if k != 'csrfmiddlewaretoken' } 
        
        # convert javascript boolean to python boolean
        bool_conv = { "true":True, "false":False }
        params["correct"] = bool_conv.get(params["correct"])

        question = Question(**params)
        question.save()
        
        return HttpResponse(status=200)
    elif request.method == 'GET':
        return HttpResponse("Hello, world. You're at the polls index.")


class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all().order_by('-date_created')[:10]
    serializer_class = QuestionSerializer

def set_targets(request):
    '''set daily targets for number of correct questions answered'''

    username = request.user.username
    targets = Target.objects.filter(username=username)

    template = loader.get_template('exercises/set_targets.html')
    operator_list = ["multiplication",
                    "addition",
                    "division with decimal",
                    "division with remainder",
                    "subtraction"]

    questions_set = (Question.objects.filter(username=username,
                    date_created__date=timezone.now(),correct=True)
                    )

    if len(questions_set) > 0:
        questions_values = pd.DataFrame.from_records(questions_set.values())
        agg = (questions_values.groupby(["operator_name","a_digits","b_digits"])["id"]
                .count().reset_index().rename({"id":"number_correct"},axis=1) 
                )  
    else:
        agg = (pd.DataFrame({"operator_name":[],
        "a_digits":[],"b_digits":[],"number_correct":[]})
        )

    targets_set = Target.objects.filter(username=username)                                                   

    targets = pd.DataFrame.from_records(targets_set.values())                                                        

    if len(targets) > 0:
        df = (targets.merge(agg,how="left",left_on=["operator_name","a_digits","b_digits"]
        ,right_on=["operator_name","a_digits","b_digits"])
            .sort_values(["operator_name","a_digits","b_digits"])
        )
        df = df.replace(np.nan,0)
        df["daily_target"] = df["daily_target"].astype(int)
        df = df.loc[df["daily_target"] > 0]
        df["target_met"] = (df["number_correct"] >= df["daily_target"]).apply(lambda x: "Yes" if x else "No")
    else: 
        df = pd.DataFrame()

    context = { 'operator_list':operator_list,
                'df':df,
                'targets':targets}

    return HttpResponse(template.render(context, request))

def submit_targets(request):
    '''set daily targets for number of correct questions answered'''

    operator_name = request.POST.get("operator_name")
    a_digits = request.POST.get("a_digits")
    b_digits = request.POST.get("b_digits")
    
    a_digits = int(a_digits)
    b_digits = int(b_digits)

    username = request.user.username
    daily_target = request.POST.get("daily_target")

    Target.objects.update_or_create(username=username,
                        a_digits=a_digits,
                        b_digits=b_digits,
                        operator_name=operator_name,
                        defaults={"daily_target": daily_target})


    base_url = reverse('exercises:set_targets')

    #query_string =  urlencode(kwargs)  # 2 category=42
    #url = '{}?{}'.format(base_url, query_string)  # 3 /products/?category=42
    return redirect(base_url)