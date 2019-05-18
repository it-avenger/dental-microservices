<template>
  <v-container
    class="fluid px-0"
  >
    <v-layout column>
      <v-flex xs12>
        <v-flex xs10 offset-xs1 class="pb-3">
          <div class="display-2"> Assessments Details </div>
        </v-flex>
      </v-flex>
    </v-layout>
    <v-layout row wrap my-3>
      <v-flex xs10 offset-xs1>
        <v-card flat>
          <chat-bot
            :titleImageUrl="titleImageUrl"
            :participants="participants"
            :onUserRatingSent="onUserRatingSent"
            :messageList="messageList"
            :newMessagesCount="newMessagesCount"
            :isOpen="isChatOpen"
            :close="closeChat"
            :open="openChat"
            :title="title"
            :showEmoji="false"
            :showFile="false"
            :colors="colors"
            :showTypingIndicator="showTypingIndicator"
            :alwaysScrollToBottom="alwaysScrollToBottom"
            :disableUserInput="disableUserInput"
            :placeholder="placeholder"
            :showRating="showRating"
            :disableRating="disableRating"
            :onMessageWasSent="onMessageWasSent"
            :showReplies="true" />
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import { mapState } from 'vuex'
import Assessment from '@/services/assessment'
import ChatBot from '@/components/chatbot/Launcher.vue'

export default {
  name: 'Assessment',
  components: {
    'chat-bot': ChatBot
  },
  data: () => ({
    assessment: new Assessment(),
    me: 0,
    threadData: { data: {}, included: [] },
    title: 'chatbot',
    participants: [
      {
        id: '4',
        name: 'chatbot',
        type: 'system',
        imageUrl: '/static/img/bot.png'
      },
      {
        id: 'me',
        name: 'user',
        type: 'user',
        imageUrl: '/static/img/user_32.png'
      }
    ],
    messageList: [],
    titleImageUrl: 'static/img/bot.png',
    newMessagesCount: 0,
    showTypingIndicator: '',
    alwaysScrollToBottom: true,
    disableUserInput: false,
    placeholder: 'Type message...',
    isChatOpen: true,
    isUserInput: false,
    colors: {
      header: {
        bg: '#f7005e',
        text: '#ffffff'
      },
      launcher: {
        bg: '#f7005e'
      },
      rating: {
        bg: '#f4f7f9'
      },
      messageList: {
        bg: '#ffffff'
      },
      sentMessage: {
        bg: '#f7005e',
        text: '#ffffff'
      },
      selectedMessage: {
        bg: '#ffffff',
        text: '#f7005e'
      },
      receivedMessage: {
        bg: '#eaeaea',
        text: '#222222'
      },
      userInput: {
        bg: '#f4f7f9',
        text: '#565867'
      }
    },
    showRating: false,
    disableRating: false,
    step: 0,
    assessmentParams: {}
  }),
  computed: {
    ...mapState('assessments', [
      'suggestions'
    ])
  },
  mounted () {
    this.getAssessment()
  },
  methods: {
    toRoute (rname, rparams = {}, query = {}) {
      this.dialog = true
      this.$router.push({ name: rname, params: rparams, query: query })
    },
    getAssessment () {
      if (this.$route.params.id !== undefined && this.$route.params.id) {
        this.assessment.view(this.$route.params.id).then(res => {
          if (res.data && res.data.relationships.message_thread) {
            this.getThread(res.data.relationships.message_thread.data.id)
          } else {
            this.$router.push({ name: 'ask' })
          }
        })
      }
    },
    getThread (id) {
      this.assessment.viewThread(id).then(res => {
        if (res.data && res.data.attributes) {
          this.threadData = res
          this.processMessageList()
          // this.messageList.push({type: 'text', author: `Support`, data: { text: res.data.attributes.initial_question }})
        } else {
          this.$router.push({ name: 'ask' })
        }
      })
    },
    processMessageList () {
      this.messageList.push({
        type: 'text',
        author: 'support',
        // author: this.participants[0].name,
        data: { text: this.threadData.data.attributes.initial_question },
        suggestions: {
          data: [{
            text: 'Yes',
            name: 'Yes1',
            value: 'Yes2',
            parent: '0'
          },
          {
            text: 'NO',
            name: 'NO1',
            value: 'NO2',
            parent: '0'
          }],
          multiple: true
        }
      })

      this.me = this.threadData.data.relationships.user.data.id
      if (this.threadData.data.relationships.messages.data.length > 0) {
        let msgData = this.threadData.included.filter(msg => {
          return msg.type === 'messages'
        })
        if (msgData.length > 0) {
          msgData.forEach((msg, index) => {
            if (msg.relationships.sender.data.id === this.me) {
              this.messageList.push({ type: 'text', author: `me`, data: { text: msg.attributes.message_text } })
              if (index === 0) {
                this.messageList.push({ type: 'text', author: this.participants[0].name, data: { text: this.threadData.data.attributes.initial_response } })
              }
            } else {
              this.messageList.push({ type: 'text', author: this.participants[0].name, data: { text: msg.attributes.message_text } })
            }
          })
        }
        this.getRating(this.$route.params.id)
      }
    },
    onMessageWasSent (msg) {
      this.messageList.push(msg)

      // if (this.step == 0) {
      //   const initialResponseMessage = {
      //     author: 'support',
      //     data: {
      //       text: this.threadData.data.attributes.initial_response
      //     },
      //     type: 'text'
      //   }

      //   this.messageList.push(initialResponseMessage)
      // } else {
      //   this.assessmentParams[this.threadData.included[this.step-1].attributes.topic] = msg.data.text
      // }

      // // add a message in channel when chatbot asking a question
      // const questionMessage = {
      //   author: 'support',
      //   data: {
      //     text: this.threadData.included[this.step].attributes.question
      //   },
      //   type: 'text',
      //   suggestions: this.getSuggestionListFromProps(this.suggestions.data[this.threadData.included[this.step].attributes.topic])
      // }

      // this.messageList.push(questionMessage)
      // this.step = this.step + 1
      
    },
    getSuggestionListFromProps (data) {
      // let res = []
      // try {
      //   data.forEach(item => {
      //     res.push(item.attributes.name)
      //   })
      // } catch (e) {
      //   return []
      // }

      // return res
    },
    onUserRatingSent (score) {
      this.assessment.submitRating(score, this.assessmentId).then(res => {
        this.messageList.push({ author: 'me', type: 'text', data: { text: '', rating: score } })
        this.disableRating = true
      })
    },
    getRating (id) {
      this.assessment.getRatings(1, id).then(res => {
        if (res.data && res.data.length) {
          this.messageList.push({ author: 'me', type: 'text', data: { text: '', rating: res.data[0].attributes.feedback_score } })
        } else {
          this.showRating = true
        }
      })
    },
    openChat () {
      this.isChatOpen = true
      this.newMessagesCount = 0
    },
    closeChat () {
      this.isChatOpen = false
    }
  }
}
</script>
