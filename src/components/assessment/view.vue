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
import { mapState, mapActions } from 'vuex'
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
    // threadId: this.$router.history.current.params.id || '', 
    // query: this.$router.history.current.params.query || null,
    participants: [
      {
        id: '4',
        name: 'chatbot',
        type: 'system',
        imageUrl: '/static/img/chat.png'
      },
      {
        id: 'me',
        name: 'user',
        type: 'user',
        imageUrl: '/static/img/user_32.png'
      }
    ],
    messageList: [],
    titleImageUrl: 'static/img/double-heart.svg',
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
    ...mapState('assessements', [
      'suggestions'
    ])
  },
  mounted () {
    this.getQuestionsByThreadId(this.$route.params.id)
  },
  methods: {
    ...mapActions('assessments', [
      'fetchSuggestions'
    ]),
    toRoute (rname, rparams = {}, query = {}) {
      this.dialog = true
      this.$router.push({ name: rname, params: rparams, query: query })
    },
    getThread (id) {
      this.assessment.viewThread(id).then(res => {
        if (res.data && res.data.attributes) {
          this.threadData = res
          console.log('threadData: ', res)
          this.processMessageList()
          // this.messageList.push({type: 'text', author: `Support`, data: { text: res.data.attributes.initial_question }})
        } else {
          this.$router.push({ name: 'ask' })
        }
      })
    },
    getQuestionsByThreadId () {
      this.assessment.getQuestionsByThreadId(this.$route.params.id).then(res => {
        console.log('suggestions: ', res)
        if (res.data) {
          this.suggestions = res
          console.log('suggestions: ', res)
        } else {
          this.$router.push({ name: 'ask' })
        }
      })
    },
    processMessageList () {
      this.messageList.push({
        type: 'text',
        author: this.participants[0].id,
        data: { text: this.threadData.data.attributes.initial_question
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
    async onMessageWasSent (msg) {
      console.log(msg, this.participants)
      this.saveMessage(msg)

      if (this.step == 0) {
        const initialResponseMessage = {
          author: this.participants[0].id,
          data: {
            text: this.threadData.data.attributes.initial_response
          },
          type: 'text'
        }

        this.saveMessage(msg)
      } else {
        this.assessmentParams[this.threadData.included[this.step-1].attributes.topic] = {
          id: msg.data.id,
          name: msg.data.text
        }
      }

      // add a message in channel when chatbot asking a question
      const questionMessage = {
        author: this.participants[0].id,
        data: {
          text: this.threadData.included[this.step].attributes.question
        },
        type: 'text',
        suggestions: this.getSuggestionListFromProps(this.suggestions.data[this.threadData.included[this.step].attributes.topic])
      }

      this.saveMessage(msg)

      if (this.step < this.threadData.included.length - 1) {
        this.step = this.step + 1
      } else {
        console.log(' ********* send predic *******', this.assessmentParams)
        const query = this.$router.history.current.params.query
        const threadId = this.$router.history.current.params.id

        const prediction = await this.assessment.getPredictons({
          message_thread: threadId,
          target_individual: this.assessmentParams['family-members'].name,
          review_by_dentist: query.review_by_dentist,
          review_by_algorithm: query.review_by_algorithm,
          // gender: this.assessmentParams.genders.id,
          gender: 1,
          body_structure: this.assessmentParams['body-structures'].id,
          age_group: this.assessmentParams['age-groups'].id,
          symptoms: [`${this.assessmentParams.symptoms.id}`],
          pain_level: this.assessmentParams['pain-levels'].id
        })

        console.log('=== prediction ========: ', prediction)
      }

    },
    getSuggestionListFromProps (props) {
      let suggestions = {}
      let data = []

      if (props) {
        props.forEach(item => {
          data.push({
            name: item.attributes.name,
            id: item.id,
            parent: '0'
          })
        })

        suggestions.data = data
        suggestions.multiple = false
      }

      return suggestions
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
    },
    async saveMessage (msg) {
      this.messageList.push(msg)

      let sender = ''
      let receiver = ''

      if (msg.author === 'me') {
        sender = 3
        receiver = this.participants[0].id
      } else {
        sender = this.participants[0].id
        receiver = 3
      }

      let formData = new FormData()
      formData.append('message_text', msg.data.text)
      formData.append('thread', this.$route.params.id)
      formData.append('sender', sender)
      formData.append('receiver', receiver)
      formData.append('is_read', true)

      const createResponse = await this.assessment.createMessage(formData)

      console.log('== createResponse ==', createResponse)
    }
  }
}
</script>