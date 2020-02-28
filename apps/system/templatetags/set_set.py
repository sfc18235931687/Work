from django import template

register = template.Library()

li = ['abc']


@register.filter
def set_set(value):
    if value == li[0]:
        return ''
    else:
        li.clear()
        li.append(value)
        return li[0]
