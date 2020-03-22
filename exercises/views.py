from django.http import HttpResponse
from django.template import loader
from rest_framework import viewsets

from .serializers import QuestionSerializer
from .models import Question, Target

from django.utils import timezone

from django.views.decorators.http import require_http_methods

import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from io import BytesIO
import base64

from django.http import JsonResponse
from django.db.models import Sum

from django.contrib.auth.forms import UserCreationForm

operator_list = ["multiplication",
                "addition",
                "division with decimal",
                "division with remainder",
                "subtraction"]

def index(request):
    
    template = loader.get_template('exercises/index.html')

    context = {}

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


def statistics(request):
    '''show some performance statistics'''

    def plot_daily_average(df,username
                       ,operator_name
                       ,a_digits
                       ,b_digits):
    
        '''plot daily average time taken to answer a given question type'''
        
        # create date column
        df["date_created"] = pd.to_datetime(df["date_created"])
        df = df.sort_values(by="date_created")
        df["date"] = df["date_created"].dt.strftime("%y-%m-%d")
        
        # select subset
        subset_df = (df.loc[(df["username"]==username) &
                (df["operator_name"]==operator_name) &
                (df["a_digits"]==a_digits) &
                (df["b_digits"]==b_digits)]
                    )
        
        # set up plot
        fig, ax = plt.subplots()
        params = {"title":f"{operator_name} {a_digits} by {b_digits}",
                "xlabel":f"date",
                "ylabel":f"time taken per question / seconds"}
        _ = ax.set(**params)
        

        
        # calculate and plot mean duration per day
        average_duration = (subset_df
            .groupby("date").mean()["duration"]
            
            )
        
        average_duration.plot(ax=ax,marker=".",markersize=10)
        
        # calculate and plot number of questions answered per day
        number_questions = (subset_df
        .groupby("date").count()["duration"]
        )
        ax2 = ax.twinx()
        number_questions.plot.bar(ax=ax2,alpha=0.4)
        ax2.set_ylabel("number of questions")
        for tick in ax.get_xticklabels():
            tick.set_rotation(45)

        _ = ax.set_xticklabels([])
        _ = ax2.set_xticklabels([])

        plt.tight_layout()
        buf = BytesIO()
        
        fig.savefig(buf, format='png', dpi=300)
        image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8').replace('\n', '')
        buf.close()
        plt.close()

        return image_base64

    def plot_weekly_accuracy(df,username
                       ,operator_name
                       ,a_digits
                       ,b_digits
                       ,min_questions=20):
        '''plot weekly accuracy'''
    
        subset_df = (df.loc[(df["username"]==username) &
        (df["operator_name"]==operator_name) &
        (df["a_digits"]==a_digits) &
        (df["b_digits"]==b_digits)]
            )

        subset_df['week start date'] = subset_df['date_created'].dt.to_period('W').apply(lambda r: r.start_time)
        agg_df = (subset_df.groupby("week start date")[["correct","id","duration"]]
                .agg({"correct":"sum","id":"count","duration":"mean"}))

        # remove weeks with less than min_questions questions answered (to avoid spurious results)
        agg_df = agg_df.loc[agg_df["id"] > min_questions]
        
        agg_df["accuracy"] = (100*agg_df["correct"]/agg_df["id"]).round(1)


        agg_df["date"] = agg_df.index
        fig, ax = plt.subplots()

        # calculate and plot mean duration per day

        agg_df.plot(x="date",y="accuracy",ax=ax,marker=".",markersize=10)
        params = {"title":f"weekly accuracy: {operator_name} {a_digits} by {b_digits}\n",
        "xlabel":f"date",
        "ylabel":f"accuracy %","ylim":(None,100)}
        _ = ax.set(**params)
        
        plt.tight_layout()
        buf = BytesIO()

        fig.savefig(buf, format='png', dpi=300)
        image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8').replace('\n', '')
        buf.close()
        plt.close()

        return image_base64

    def plot_weekly_average_time(df,username
                       ,operator_name
                       ,a_digits
                       ,b_digits
                       ,min_questions=20):
        '''plot weekly average time'''
    
        subset_df = (df.loc[(df["username"]==username) &
        (df["operator_name"]==operator_name) &
        (df["a_digits"]==a_digits) &
        (df["b_digits"]==b_digits)]
            )

        subset_df['week start date'] = subset_df['date_created'].dt.to_period('W').apply(lambda r: r.start_time)
        agg_df = (subset_df.groupby("week start date")[["correct","id","duration"]]
                .agg({"correct":"sum","id":"count","duration":"mean"}))

        # remove weeks with less than min_questions questions answered (to avoid spurious results)
        agg_df = agg_df.loc[agg_df["id"] > min_questions]

        agg_df["date"] = agg_df.index
        fig, ax = plt.subplots()

        # calculate and plot mean duration per day

        agg_df.plot(x="date",y="duration",ax=ax,marker=".",markersize=10)
        params = {"title":f"weekly average time per question: {operator_name} {a_digits} by {b_digits}\n",
        "xlabel":f"date",
        "ylabel":f"time per question (seconds)"}
        _ = ax.set(**params)
        
        plt.tight_layout()
        buf = BytesIO()

        fig.savefig(buf, format='png', dpi=300)
        image_base64 = base64.b64encode(buf.getvalue()).decode('utf-8').replace('\n', '')
        buf.close()
        plt.close()

        return image_base64

    def accuracy_all_time(df,username
                        ,operator_name
                        ,a_digits
                        ,b_digits):
        '''calculate all time accuracy of this exercise'''
        
        subset_df = (df.loc[(df["username"]==username) &
            (df["operator_name"]==operator_name) &
            (df["a_digits"]==a_digits) &
            (df["b_digits"]==b_digits)]
                )
        
        accuracy = subset_df["correct"].sum()/subset_df["id"].count()
        accuracy_pct = round(100*accuracy,1)
        
        return accuracy_pct

    template = loader.get_template('exercises/statistics.html')

    username = request.user.username
    operator_name = request.GET.get("operator_name","addition")
    a_digits = int(request.GET.get("a_digits",1))
    b_digits = int(request.GET.get("b_digits",1))

    questions_set = (Question.objects.filter(username=username,
                                            operator_name=operator_name,
                                            a_digits=a_digits,
                                            b_digits=b_digits))

    if len(questions_set) > 0:
        df = pd.DataFrame.from_records(questions_set.values())
      
        #image_base64 = None
        
        image_base64 = plot_daily_average(df,username=username
                       ,operator_name=operator_name
                       ,a_digits=a_digits
                       ,b_digits=b_digits)

        weekly_accuracy = plot_weekly_accuracy(df,username=username
                       ,operator_name=operator_name
                       ,a_digits=a_digits
                       ,b_digits=b_digits)

        weekly_duration =  plot_weekly_average_time(df,username=username
                       ,operator_name=operator_name
                       ,a_digits=a_digits
                       ,b_digits=b_digits)

        accuracy_all_time = accuracy_all_time(df,username=username
                       ,operator_name=operator_name
                       ,a_digits=a_digits
                       ,b_digits=b_digits)

    else:
        image_base64 = None

        accuracy_all_time = None

        weekly_duration = None


    context = { "weekly_duration":weekly_duration,
                "weekly_accuracy":weekly_accuracy,
                "accuracy_all_time":accuracy_all_time,
                "image_base64":image_base64,
                "operator_name":operator_name,
                "username":username,
                "a_digits":a_digits,
                "b_digits":b_digits,
                'operator_list':operator_list,
                }

    return HttpResponse(template.render(context, request))  




def get_daily_stats(request):

    username = request.GET.get("username")
    operator_name = request.GET.get("operator_name")
    a_digits = request.GET.get("a_digits")
    b_digits = request.GET.get("b_digits")

    qset = Question.objects.filter(username=username,
                                       operator_name=operator_name,
                                       a_digits=a_digits,
                                       b_digits=b_digits,
                                       date_created__date=timezone.now()
                                       )

    correct = qset.filter(correct=True).count()
    total = qset.count()
    total_duration = qset.aggregate(Sum('duration'))['duration__sum'] or 0

    try:
        daily_target = Target.objects.get(operator_name=operator_name
                                        ,username=username
                                        ,a_digits=a_digits
                                        ,b_digits=b_digits).daily_target
    except:
        daily_target = 0

    data = {
        'correct': correct,
        'total': total,
        'total_duration': total_duration,
        'daily_target': daily_target
    }

    return JsonResponse(data)


def signup(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            raw_password = form.cleaned_data.get('password1')
            user = authenticate(username=username, password=raw_password)
            login(request, user)
            return redirect('exercises:index')
    else:
        form = UserCreationForm()

    template = loader.get_template('exercises/signup.html')

    context = {'form': form}

    return HttpResponse(template.render(context, request))
