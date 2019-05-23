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
    participants: [
      {
        id: '4',
        name: 'chatbot',
        type: 'system',
        imageUrl: '/static/img/chatbot.png'
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
    showTypingIndicator: 'false',
    alwaysScrollToBottom: true,
    disableUserInput: false,
    placeholder: 'Type message...',
    isChatOpen: true,
    isUserInput: true,
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
    oldStep: 0,
    step: -1,
    questions: [],
    questionHash: {},
    additionalQuestionHash: {},
    assessmentParams: {},
    createdAssessmentId: 3,
  }),
  computed: {
    ...mapState('assessments', [
      'additionalQuestions'
    ])
  },
  async mounted () {
    await this.getQuestionsByThreadId()
    this.getThread(this.$route.params.id)
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
          this.processMessageList()
        } else {
          this.$router.push({ name: 'ask' })
        }
      })
    },
    getQuestionsByThreadId () {
      this.assessment.getQuestionsByThreadId(this.$route.params.id).then(res => {
        if (res.data) {
          this.questions = res.data

          res.data.forEach((item, idx) => {
            let isNext = null;
            if (idx !== res.data.length - 1) {
              isNext = res.data[idx+1].attributes.topic
            }
            this.questionHash[item.attributes.topic] = { ...item, next: isNext }
          })

          this.additionalQuestions.forEach((item, idx) => {
            let isNext = null;
            if (idx !== this.additionalQuestions.length - 1) {
              isNext = this.additionalQuestions[idx+1].topic
            }

            this.additionalQuestionHash[item.topic] = { ...item, next: isNext }
          })
        } else {
          this.$router.push({ name: 'ask' })
        }
      })
    },
    async processMessageList () {
      let next = null // last question topic
      this.messageList.push({
        type: 'text',
        author: this.participants[0].id,
        data: { text: this.threadData.data.attributes.initial_question
        }
      })

      this.showTypingIndicator = ''

      this.me = this.threadData.data.relationships.user.data.id

      // prepopulated the messages are sent on this thread
      if (this.threadData.data.relationships.messages.data.length > 0) {
        let msgData = this.threadData.included.filter(msg => {
          return msg.type === 'messages'
        })
        if (
          msgData.length > 0 &&
          Object.keys(this.questionHash).length > 0 &&
          Object.keys(this.additionalQuestionHash).length > 0
        ) {
          msgData.forEach(async (msg, index) => {
            if (
              msg.relationships.sender.data.id === this.me &&
              msg.attributes.topic && msg.attributes.topic !== '' &&
              msg.attributes.topic !== 'undefined'
            ) {
              const topic = msg.attributes.topic

              if (msg.attributes.topic === 'initial_response') {
                if (this.oldStep >= 1 )  { return }
                this.messageList.push({ type: 'text', author: `me`, data: { text: msg.attributes.message_text } })
                this.messageList.push({ type: 'text', author: this.participants[0].id, data: { text: this.threadData.data.attributes.initial_response } })
              }

              if (topic !== 'initial_response'){
                // main questions (from api)

                if (this.questionHash.hasOwnProperty(topic)) {
                  
                  let suggestions = {}
                  if (topic === 'symptoms') {
                    const res = await this.assessment.getSymptoms(this.questionHash['age-groups'].id, this.questionHash['body-structures'].id)

                    if (res.data) {
                      const data = await res.included.map(item => {
                        return {...item.attributes, parent: '0'} 
                      })

                      suggestions = {
                        data: data,
                        multiple: this.questionHash.symptoms.attributes['input-type'] === 'choice' ? false : true
                      }
                    }
                  } else {
                    suggestions = this.getSuggestionListFromProps(this.questionHash[topic].attributes)
                  }

                  const questionMessage = {
                    author: this.participants[0].id,
                    data: {
                      text: this.questionHash[topic].attributes.question,
                      topic: this.questionHash[topic].attributes.topic
                    },
                    type: 'text',
                    suggestions: suggestions
                  }

                  this.messageList.push(questionMessage)

                  this.messageList.push({ type: 'text', author: `me`, data: { text: msg.attributes.message_text } })
                  this.messageList.push({ type: 'text', author: this.participants[0].id, data: { text: this.questionHash[topic].attributes.response } })
                  next = this.questionHash[topic].next

                  this.assessmentParams[topic] = {
                    id: this.getOptionId(this.questionHash[topic].id, msg.attributes.message_text),
                    name: msg.attributes.message_text
                  }

                } else {
                  this.messageList.push({
                    type: 'text',
                    author: this.participants[0].id,
                    data: {
                      text: this.additionalQuestionHash[topic].question,
                      topic: this.additionalQuestionHash[topic].topic
                    },
                    suggestions: {}
                  })
                  this.messageList.push({ type: 'text', author: `me`, data: { text: msg.attributes.message_text } })
                  this.messageList.push({ type: 'text', author: this.participants[0].id, data: { text: this.additionalQuestionHash[topic].response } })
                  next = this.additionalQuestionHash[topic].next
                }
              }

              this.step = this.step + 1
            }
          })
        }

        if (next !== null) {
          // ask a question after user write a message (cause only user's message are saved in db)
          if (this.questionHash.hasOwnProperty(next)) {
            let suggestions = {}
            if (next === 'symptoms') {
              const res = await this.assessment.getSymptoms(this.questionHash['age-groups'].id, this.questionHash['body-structures'].id)

              if (res.data) {
                const data = await res.included.map(item => {
                  return {...item.attributes, parent: '0'} 
                })

                suggestions = {
                  data: data,
                  multiple: this.questionHash.symptoms.attributes['input-type'] === 'choice' ? false : true
                }
              }
            } else {
              suggestions = this.getSuggestionListFromProps(this.questionHash[next].attributes)
            }

            const questionMessage = {
              author: this.participants[0].id,
              data: {
                text: this.questionHash[next].attributes.question,
                topic: this.questionHash[next].attributes.topic
              },
              type: 'text',
              suggestions: suggestions
            }

            this.messageList.push(questionMessage)

          } else {
            this.messageList.push({
              type: 'text',
              author: this.participants[0].id,
              data: {
                text: this.additionalQuestionHash[next].question,
                topic: this.additionalQuestionHash[next].topic
              },
              suggestions: {}
            })
          }
        }

        // this.getRating(this.$route.params.id)
      }
    },
    showWaiting () {
      this.showTypingIndicator = 'true'
      return new Promise ((resolve, reject) => {
        setTimeout(() => {
          this.showTypingIndicator = ''
          resolve(true)
        }, 600)
      })
    },
    async onMessageWasSent (msg) {

      if (this.step < this.questions.length + this.additionalQuestions.length - 1) {
        if (this.step == -1) {
          let newMessage = Object.assign({}, msg)
          newMessage.data.topic = 'initial_response'

          this.saveMessage(newMessage)
          this.messageList.push(newMessage)

          const responseMessage = {
            author: this.participants[0].id,
            data: {
              text: this.threadData.data.attributes.initial_response,
              topic: 'initial_response'
            },
            type: 'text'
          }
          this.messageList.push(responseMessage)
        } else {
          this.saveMessage(msg)
          let responseMessage = {}

          if (this.step < this.questions.length) {
            responseMessage = {
              author: this.participants[0].id,
              data: {
                text: this.questions[this.step].attributes.response,
                topic: this.questions[this.step].attributes.topic
              },
              type: 'text'
            }

            this.assessmentParams[this.questions[this.step].attributes.topic] = {
              id: msg.data.id,
              name: msg.data.text
            }
          } else {
            responseMessage = {
              author: this.participants[0].id,
              data: {
                text: this.additionalQuestions[this.step - this.questions.length].response
              },
              type: 'text'
            }

            this.assessmentParams[this.additionalQuestions[this.step - this.questions.length].topic] = {
              id: msg.data.id,
              name: msg.data.text
            }
          }

          this.messageList.push(responseMessage)
        }

        if (this.step < this.questions.length - 1) {
          // add a message in channel when chatbot asking a question
          let suggestions = {}
          if (this.questions[this.step + 1].attributes.topic != 'symptoms') {
            suggestions = this.getSuggestionListFromProps(this.questions[this.step + 1].attributes)
            
          } else {

            this.showTypingIndicator = 'true'
            const res = await this.assessment.getSymptoms(this.assessmentParams['age-groups'].id, this.assessmentParams['body-structures'].id)
            this.showTypingIndicator = ''

            if (res.data) {
              const data = await res.included.map(item => {
                return {...item.attributes, parent: '0'} 
              })

              suggestions = {
                data: data,
                multiple: this.questions[this.step + 1].attributes['input-type'] === 'choice' ? false : true,
                topic: 'symptoms'
              }

            }
          }

          const questionMessage = {
            author: this.participants[0].id,
            data: {
              text: this.questions[this.step + 1].attributes.question,
              topic: this.questions[this.step + 1].attributes.topic
            },
            type: 'text',
            suggestions: suggestions
          }

          this.messageList.push(questionMessage)

        } else {
          // additional questions
          let suggestions = {}
          if (this.additionalQuestions[this.step - this.questions.length + 1].topic === 'prediction') {
            const threadId = this.$route.params.id
            this.showTypingIndicator = 'true'
            const prediction = await this.assessment.getPredictons({
              message_thread: threadId,
              target_individual: this.assessmentParams['family-members'].name,
              review_by_dentist: false,
              review_by_algorithm: false,
              gender: this.assessmentParams.genders.id,
              body_structure: this.assessmentParams['body-structures'].id,
              age_group: this.assessmentParams['age-groups'].id,
              symptoms: this.assessmentParams.symptoms.id,
              pain_level: this.assessmentParams['pain-levels'].id
            })
            this.showTypingIndicator = ''
            const predictionItem = await this.assessment.view(prediction.data.id)
            const predictionScoreList = await this.assessment.getPredictionScoresById(predictionItem.data.id)

            let listOptionData = []
            if (predictionScoreList.included) {
              for (let i = 0; i < predictionScoreList.included.length; i += 1) {
                const score = predictionScoreList.included[i]
                const scoreCategry = await this.assessment.getCategoryById(score.id)
                if (scoreCategry.data) {
                  listOptionData.push({
                    name: scoreCategry.data.attributes.name,
                    uuid: scoreCategry.data.attributes.uuid,
                    description: scoreCategry.data.attributes.description
                  })
                }
              }
            }

            const questionMessage = {
              author: this.participants[0].id,
              data: {
                text: this.additionalQuestions[this.step - this.questions.length + 1].question,
                topic: this.additionalQuestions[this.step - this.questions.length + 1].topic,
                data: listOptionData
              },
              type: 'list',
            }

            this.messageList.push(questionMessage)

            let data = {
              text: 'Rembember that above suggestions are guiding. If you are concerned, you should visit your dentist. We are always looking to improve our services, so please leave your feedback:',
              topic: 'user-rating',
              rating: 0
            }
            const responseMessage = {
              author: this.participants[0].id,
              data: data,
              type: 'rating'
            }

            this.messageList.push(responseMessage)

          } else {
            const questionMessage = {
            author: this.participants[0].id,
              data: {
                text: this.additionalQuestions[this.step - this.questions.length + 1].question,
                topic: this.additionalQuestions[this.step - this.questions.length + 1].topic
              },
              type: 'text',
            }

            this.messageList.push(questionMessage)
          }
        }

        this.step = this.step + 1
      } else {
        if (msg.topic && msg.topic === 'user-rating') {
          this.submitRating(mgs.rating, this.createdAssessmentId)
          const lastMessage = {
            author: this.participants[0].id,
            data: {
              text: 'Ok, thank you'
            },
            type: 'text',
          }

          this.messageList.push(lastMessage)
          this.disableUserInput = true
        }
      }

    },
    getSuggestionListFromProps (props) {
      let suggestions = {}
      let data = []

      if (props.options && props.options.data) {
        props.options.data.forEach(item => {
          data.push({
            name: item.attributes.name,
            id: item.id,
            topic: props.topic,
            parent: '0'
          })
        })

        suggestions.data = data
        suggestions.multiple = props['input-type'] === 'choice' ? false : true
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
        sender = this.me
        receiver = this.participants[0].id
      } else {
        sender = this.participants[0].id
        receiver = this.me
      }

      let formData = new FormData()
      formData.append('message_text', msg.data.text)
      formData.append('topic', msg.data.topic)
      formData.append('thread', this.$route.params.id)
      formData.append('sender', sender)
      formData.append('receiver', receiver)
      formData.append('is_read', true)

      const createResponse = await this.assessment.createMessage(formData)
    },
    getOptionId(questionId, optionText) {
      let optionId = null

      this.questions.forEach((question) => {
        if (question.id === questionId && question.attributes.options) {
          question.attributes.options.data.forEach((option) => {
            if (option.attributes.name === optionText) {
              optionId = option.id
            }
          })
        }
      })

      return optionId
    }
  }
}
</script>
