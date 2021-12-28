from django.db import models
import random
import operator

# Dictionary converting operator symbols to operator functions
operator_name2symbol = { "multiplication":"×",
                    "addition":"+",
                    "division with decimal":"/",
                    "division with remainder":"/",
                    "subtraction":"-" }

operator_name2function = { "multiplication":operator.mul,
                            "addition":operator.add,
                            "division with decimal":operator.truediv,
                            "division with remainder":divmod,
                            "subtraction":operator.sub }

class Question(models.Model):
    operator_name = models.CharField(max_length=200)
    a_digits = models.IntegerField(default=2)
    b_digits = models.IntegerField(default=2)
    question = models.CharField(max_length=200)
    answer = models.CharField(max_length=200)
    user_answer = models.CharField(max_length=200,default=None,null=True,blank=True)
    correct = models.BooleanField(null=True,blank=True)
    username = models.CharField(max_length=200,null=True,blank=True)
    duration = models.FloatField(default=None,null=True,blank=True)
    date_created = models.DateTimeField(verbose_name=("Creation date"), auto_now_add=True, null=True)
    read_aloud = models.BooleanField(default=False)
        
    class Meta:
        # Latest by priority descending, order_date ascending.
        get_latest_by = ["date_created"]

    def set_question(self,operator_name="addition",
                            a_digits=2,b_digits=2):
        '''generate question and answer tuple for the evaluation
            of expression a operator b = c '''



        # Set the lower and upper limits of numbers a and b
        # Add 1 to lower limits so that you are never using 1 or 
        # Multiples of 10 as operands (that would be too easy)
        a_lower_limit = pow(10,a_digits - 1) + 1 
        a_upper_limit = pow(10,a_digits)
        b_lower_limit = pow(10,b_digits - 1) + 1
        b_upper_limit = pow(10,b_digits)

        a = random.randrange(a_lower_limit,a_upper_limit)
        b = random.randrange(b_lower_limit,b_upper_limit)


        func = operator_name2function.get(operator_name,operator.add)


        operator_symbol = operator_name2symbol[operator_name]

        question = f"{a} \n {operator_symbol} {b}"

        answer = str(func(a,b))

        self.a_digits = a_digits
        self.b_digits = b_digits
        self.operator_name = operator_name
        self.question = question
        self.answer = answer
        self.save()

        return None

    def set_user_answer(self,user_answer):
        self.user_answer = user_answer
        # If answer is a decimal fraction check correct to 3 decimal places
        if "." in self.answer:
            self.correct = abs(float(self.user_answer) - float(self.answer)) < 0.001
        else:
            self.correct = self.user_answer == self.answer
        self.save()

    def set_duration(self,duration):
        self.duration = duration
        self.save()


class Target(models.Model):
    operator_name = models.CharField(max_length=200)
    a_digits = models.IntegerField()
    b_digits = models.IntegerField()
    daily_target = models.IntegerField()
    username = models.CharField(max_length=200,null=True,blank=True)