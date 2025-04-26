from django.urls import path
from . import views

urlpatterns = [
    path('auth-receiver', views.auth_receiver, name='auth_receiver'),
    path("", views.home, name = "home"),
    path("sign-in", views.sign_in, name='sign_in'),
    path("sign-out", views.sign_out, name='sign_out'),
    path("add-product", views.add_product, name='add_product'),
    path("item/<int:id>", views.item_detail, name='item_detail'),
    path('my-listings/', views.my_listings, name='my_listings'),
    path("delete-item/<int:id>/", views.delete_item, name='delete_item'),
    path("edit-item/<int:id>", views.edit_item, name="edit_item"),
    path("feedback", views.feedback, name='feedback'),
    path("marksold/<int:id>", views.marksold, name = "marksold"),
    path("about-us", views.about_us, name='about_us'),
    path("categories", views.categories, name='categories'),
    path("repost/<int:id>", views.repost, name="repost"),
    path("bulk-action/<str:action>/", views.bulk_action, name="bulk_action"),
    path("log-install/", views.log_install, name="log_install"),
    path("terms", views.terms, name='terms'),
    path("bypass", views.bypass, name='bypass'),
]
