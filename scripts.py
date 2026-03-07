from server.constants import *
from django.db import connection
from django.db.models.functions import Trunc
from cryptography.fernet import Fernet
import itertools
from django.contrib.auth.models import User
from django.contrib.sessions.models import Session
from django_celery_beat.models import PeriodicTask, IntervalSchedule
from server.models import *
from influencer_admin.models import InfluencerUser
from server.serializers import *
from django.contrib.gis.geos import Point
from django.db.models import F
from server.constants import *
from geopy.distance import distance
from django.contrib.gis.measure import D
from server.tasks import *
from server.extensions import * 
from server.tools import *
from google_auth_oauthlib.flow import Flow
from itertools import chain
from django.apps import apps as server
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from random import randint, sample
import json
import pprint
import polyline
import base64
from timezonefinder import TimezoneFinder
from server.tools import get_s3_url_for_external_asset
from push_notifications.models import APNSDevice
from pytz import timezone as tz
from datetime import datetime
from dateutil.parser import parse
from HashCashApp.celery import app as celery 
from django.template.loader import get_template
import requests
from django.core.mail import EmailMultiAlternatives
import random
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from server.decorators import benchmark, LineBenchmark
from Crypto.Util import number
from mnemonic import Mnemonic
from cosmpy.crypto.keypairs import PrivateKey
from bip_utils import Bip39SeedGenerator, Bip44, Bip44Coins
from requests.adapters import HTTPAdapter, Retry
import jwt

tf = TimezoneFinder()
inspector = celery.control.inspect()
p = pprint.PrettyPrinter(indent=4)
user = User.objects.last()
app = App.objects.last()
api = Api.objects.last()
zac = Profile.objects.filter(email='zacwickstrom@gmail.com').first()
david = Profile.objects.filter(email='drmyr@protonmail.com').first()
justin = Profile.objects.filter(email='ironbrite37@gmail.com').first()
project_atonomy = Profile.objects.filter(email='safelife4200@gmail.com').first()
mom = Profile.objects.filter(email='suzanstrong@gmail.com').first()
zac2 = Profile.objects.filter(email='zac@valtdata.com').first()
test = Profile.objects.filter(email='test@breadcrumbsdata.com').first()
zac3 = Profile.objects.filter(email='wickstrom913@gmail.com').first()
aly = Profile.objects.filter(email='ale.rodmen8@gmail.com').first()
mcdowall = Profile.objects.filter(email='jm@arcanum.capital').first()
james = Profile.objects.filter(email='jms.goodnight@gmail.com').first()
dmitry = Profile.objects.filter(email='dmitrypeshkov@icloud.com').first()
charlie = Profile.objects.filter(phone_number='14436849033').first()
carlos = Profile.objects.filter(phone_number='15052501383').first()
dad = Profile.objects.filter(email='glwickstrom@gmail.com').first()
jack = Profile.objects.filter(email='wickstromjack@gmail.com').first()
barb = Profile.objects.filter(email='barbpudlo@msn.com').first()
jarrett = Profile.objects.filter(email='jjturkish12@gmail.com').first()
jarrett2 = Profile.objects.filter(email='vivid.productions@icloud.com').first()
jarrett3 = Profile.objects.filter(email='jarrett@valtdata.com').first()
vanessa = Profile.objects.filter(email='dubley162@gmail.com').first()
jane = Profile.objects.filter(email='huynhjane3@gmail.com').first()
test = Profile.objects.filter(email='test@breadcrumbsdata.com').first()
chris = Profile.objects.filter(email='chrisahn9@gmail.com').first()
chrisP = Profile.objects.filter(email='chrispapamichail7@gmail.com').first()
armando = Profile.objects.filter(email='armanzav31@gmail.com').first()
zara = Profile.objects.filter(email='iamszara@gmail.com').first()
location = Location.objects.last()
location_batch = LocationBatch.objects.last()
post = Post.objects.get(id=3235799)
node = Node.objects.last()
notification = Notification.objects.last()
user_upload = UserUpload.objects.last()
device = APNSDevice.objects.last()
now = pytz.utc.localize(datetime.now())
offer = Offer.objects.last()
offer_response = OfferResponse.objects.last()
buyer = Buyer.objects.last()
# weather_snapshot = WeatherSnapshot.objects.last()
link = BCRKLink.objects.last()
question = ProfileDetailQuestion.objects.last()
embedding_record = EmbeddingRecord.objects.last()
llm_record = LLMRecord.objects.last()
prompt = Prompt.objects.last()
blob = Blob.objects.last()

# connection = 'url'
# collection_name = "embeddings"
# embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
#
# vectorstore = PGVector(
#     embeddings=embeddings,
#     collection_name=collection_name,
#     connection=connection,
#     use_jsonb=True,
# )
#
# doc = Document(page_content=f'{post.text[:-1]} at {post.posted_at.strftime("%Y-%m-%dT%H:%M:%SZ")}.')
# vectorstore.add_documents([doc])
#
# vectorstore.similarity_search("What's a website I've visited?", k=10)


# to distribute electron:
# CSC_KEY_PASSWORD=cgdaeb \
#     CSC_IDENTITY_AUTO_DISCOVERY=false \
#   CSC_LINK=$(openssl base64 -in Certificates.p12) \
#   APPLE_TEAM_ID=35Y5AA342J \
# yarn dist

# To get binaries in .pkg, I created a sub-package called breadcrumbsBin.pkg
# first I code signed each binary, i.e.:
    # sudo codesign --force --deep --sign "Developer ID Application: Hashcash Inc. (35Y5AA342J)" --options runtime ip
    # note some binaries are already signed by apple or trusted 3rd parties and so you're good

# then I built and signed package
# pkgbuild --identifier com.breadcrumbs.bin.pkg --install-location ./usr/local/bin/ --root ./ breadcrumbsBin.pkg
# productsign --sign "Developer ID Installer: Hashcash Inc. (35Y5AA342J)" ./breadcrumbsBin.pkg ./breadcrumbsBinSigned.pkg

# then I built the primary package in Packages (an app by Whitebox). Then, notarization:
# install Packages app with this: curl -o ./filename http://s.sudre.free.fr/files/Packages_1211_dev.dmg

# #deprecated old flow:#
#xcrun altool --notarize-app --primary-bundle-id "com.breadcrumbs.electron" --username "zacwickstrom@gmail.com" --password "xbcx-melr-gkbh-vmao" --file "/Users/apple/Breadcrumbs/build/Breadcrumbs.pkg"

# #new flow:# app specific profile: VALT pw: sjnb-eyqu-kwpf-srkj
# xcrun notarytool store-credentials --apple-id "zacwickstrom@gmail.com" --team-id "35Y5AA342J"
# xcrun notarytool submit /Users/zacwickstrom/VALT/build/VALT.pkg --keychain-profile "VALT" 
# xcrun notarytool info "{id}" --keychain-profile "VALT"
# i.e.
# xcrun notarytool info "972eb3e2-b254-4222-a564-a2aa42b77119" --keychain-profile "VALT"
# if it comes back invalid, check status with xcrun notarytool log "88dde3ee-1422-490b-8c4c-7d673ecbcc0e" --keychain-profile "VALT"  
# Make sure each binary is signed (see "first I code signed each binary" above) and also the package itself is signed, i.e. productsign --sign "Developer ID Installer: Hashcash Inc. (35Y5AA342J)" VALT-unsigned.pkg VALT.pkg

# NOTE: the latest strategy for getting binaries where they need to be is to install them in a place that Packages.app can install them, i.e. /Library/Application Support/binaries, and then use postinstall.sh to move them. see postinstall.sh


# 5/26/25 MacOS deploy flow:
# CSC_KEY_PASSWORD=cgdaeb \
#     CSC_IDENTITY_AUTO_DISCOVERY=false \
#   CSC_LINK=$(openssl base64 -in Certificates.p12) \
#   APPLE_TEAM_ID=35Y5AA342J \
# yarn dist
#
# move the app into /VALT folder
# open packages project in that folder
# make sure new app is in the payload
# build the package
# rename it to VALT-unsigned.pkg
# sign the package with productsign --sign "Developer ID Installer: Hashcash Inc. (35Y5AA342J)" VALT-unsigned.pkg VALT.pkg
# run xcrun notarytool store-credentials --apple-id "zacwickstrom@gmail.com" --team-id "35Y5AA342J" with app specific profile: VALT pw: sjnb-eyqu-kwpf-srkj
# run xcrun notarytool submit /Users/zacwickstrom/VALT/build/VALT.pkg --keychain-profile "VALT" 
# check status with xcrun notarytool info "{id}" --keychain-profile "VALT"
# when accepted, upload to https://scribr-uploads.s3.us-east-2.amazonaws.com/VALT.pkg

# note that the package project already has all signed binaries needed for MacOS

# for MacOS updates:
# CSC_KEY_PASSWORD=cgdaeb \
#     CSC_IDENTITY_AUTO_DISCOVERY=false \
#   CSC_LINK=$(openssl base64 -in Certificates.p12) \
#   APPLE_TEAM_ID=35Y5AA342J \
# yarn dist
#
# move the latest-mac.yml, .zip, and .zip.blockmap to https://scribr-uploads.s3.us-east-2.amazonaws.com/publish/${process.platform}/${process.arch}

# celery.control.purge()

# to push to staging:
# git push staging staging:main

# to run frontend tests, go to frontend folder and do yarn playwright test


# OPTERY API

# optery_members_response = requests.get(f"https://business-api.optery.com/v1/members",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_plans_response = requests.get(f"https://business-api.optery.com/v1/plans",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_subscriptions_response = requests.get(f"https://business-api.optery.com/v1/subscriptions",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_subscribe_member_response = requests.posts(f"https://business-api.optery.com/v1/subscriptions/{uuid}",
#         headers={
#             "Accept": "application/json",
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         },
#         data={
#             'plan_uuid': plan_uuid_from_plans_response
#         },
#     ).json()

# optery_member_addresses_response = requests.get(f"https://business-api.optery.com/v1/members/{uuid}/addresses",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_emails_response = requests.get(f"https://business-api.optery.com/v1/members/{uuid}/emails",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_names_response = requests.get(f"https://business-api.optery.com/v1/members/{uuid}/names",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_phones_response = requests.get(f"https://business-api.optery.com/v1/members/{uuid}/phones",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_relatives_response = requests.get(f"https://business-api.optery.com/v1/members/{uuid}/relatives",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_companies_response = requests.get(f"https://business-api.optery.com/v1/members/{uuid}/companies",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_info_response = requests.get(f"https://business-api.optery.com/v1/members/{uuid}/info",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_statistics_response = requests.get(f"https://business-api.test.optery.com/v1/optouts/{uuid}/statistics",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_brokers_response = requests.get(f"https://business-api.optery.com/v1/optouts/{uuid}",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_gallery_response = requests.get(f"https://business-api.optery.com/v1/optouts/{uuid}/gallery",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_screenshots_response = requests.get(f"https://business-api.optery.com/v1/optouts/{uuid}/screenshots",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_events_response = requests.get(f"https://business-api.optery.com/v1/optouts/{uuid}/events",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_scheduled_scan_response = requests.get(f"https://business-api.optery.com/v1/optouts/{uuid}/scan/scheduled",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()

# optery_member_scan_dates_response = requests.get(f"https://business-api.optery.com/v1/optouts/{uuid}/scan/dates",
#         headers={
#             "Content-Type": "application/json",
#             "Authorization": f"Bearer {OPTERY_API_KEY}"
#         }
#     ).json()