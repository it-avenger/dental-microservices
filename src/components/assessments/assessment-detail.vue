<template>
  <v-container>
    <v-layout column>
      <v-flex column>
        <div class="page-title"> Assessment: {{ assessmentId }} </div>
        <div
          class="page-deciption"
          :class="[status === false ? 'orange--text' : 'success--text']"
        >
          {{ assessmentStatusTitle }}
        </div>
      </v-flex>
      <v-flex class="my-2 page-description">
        <span> {{ assessmentStatusDescription }} </span>
      </v-flex>
      <v-flex v-if="status === true">
        <v-card class="assessment-review">
          <div class="assessment-review__banner">
            <v-stage :config="configKonva">
              <v-layer>
                <v-image
                  :config="{
                    image: image
                  }"
                />
                <v-rect
                  v-for="prediction in showPredictions()"
                  :key="prediction.key"
                  :config="getOverlayPolygon(prediction)"
                />
              </v-layer>
            </v-stage>
          </div>
          <div class="assessment-review__footer">
            <div
              v-for="(prediction, i) in predictions"
              :key="`prediction${i}`"
              class="assessment-review-item"
            >
              <v-img
                :src="prediction.img"
                class="footer-preview-image"
                :class="prediction.active ? 'active' : ''"
                @click="setCurrentPredictionId(prediction.id)"
              />
            </div>
            <div class="assessment-review-item">
              <v-switch
                v-model="switch1"
                color="#6bb3da"
              />
            </div>
          </div>
        </v-card>
      </v-flex>
      <v-flex v-else>
        <v-card>
          <div class="assessment-review__banner">
            <v-carousel
              :value="activeImage"
              @change="onChangeCarouseImage($event)"
            >
              <v-carousel-item
                v-for="(prediction,i) in predictions"
                :key="i"
                :src="prediction.img"
              />
            </v-carousel>
          </div>
          <div class="assessment-review__footer">
            <div
              v-for="(prediction, i) in predictions"
              :key="`prediction${i}`"
              class="assessment-review-item"
            >
              <v-img
                :src="prediction.img"
                class="footer-preview-image"
                :class="activeImage == i ? 'active' : ''"
                @click="onChangeCarouseImage(i)"
              />
            </div>
            <div class="assessment-review-item">
              <v-switch
                v-model="switch1"
                color="#6bb3da"
              />
            </div>
          </div>
        </v-card>
      </v-flex>
      <v-flex
        v-if="status === false"
        class="mt-5 text-center"
      >
        <router-link
          to="#"
          class="white--text btn-create-assessment my-3"
          @click.native="showModal()"
        >
          Delete assessment
        </router-link>
      </v-flex>
      <v-flex v-else>
        <v-flex class="mt-4">
          <div class="section-title"> Potential issues </div>
          <div class="section-description"> Select view on images </div>
          <v-flex
            xs12
            sm4
            md4
          >
            <v-checkbox
              v-for="prediction in showPredictionScores()"
              :key="`predict-checkbox-${prediction.categoryId}`"
              :label="getNameOfCategoryById(prediction.categoryId)"
              value="prediction.active"
              hide-details
              :color="prediction.color"
              @change="activePrediction(prediction.key)"
            />
          </v-flex>
        </v-flex>
        <!-- <v-flex class="mt-3">
          <div class="section-title"> Status </div>
          <div class="section-desctiption"> Frequency (High, Mid, Low) </div>
          <div class="section-desctiption"> Severity (High, Mid, Low) </div>
        </v-flex> -->
        <v-flex class="mt-5">
          <div class="section-title"> Notes </div>
          <div class="section-description"> {{ personalizedPrompt }} </div>
        </v-flex>
      </v-flex>
    </v-layout>
    <v-dialog
      v-model="dialog"
      fullscreen
      hide-overlay
      content-class="custom-dialog custom-dialog--light-blue"
      transition="dialog-bottom-transition"
    >
      <v-layout
        justify-center
        row
        fill-height
      >
        <div class="question-content">
          <div class="big-title">Are you sure you want to delete this assessment?</div>
          <v-layout
            justify-center
            align-center
          >
            <button
              class="big-title mr-5"
              @click="deleteAssessment()"
            >
              Yes
            </button>
            <button
              class="big-title"
              @click="showModal()"
            >
              No
            </button>
          </v-layout>
        </div>
      </v-layout>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import _ from 'loadsh'

const emptyImage = 'https://cdn.vuetifyjs.com/images/cards/desert.jpg'

export default {
  name: 'AssessmentDetail',
  data () {
    return {
      switch1: true,
      status: false,
      ex4: ['success'],
      assessmentId: this.$router.history.current.params.id || '',
      personalizedPrompt: '',
      predictions: [],
      predictionScores: [],
      overlays: [], // it is same as predictions, but used to show ploygons
      configKonva: { // canvas settings for banner image
        width: 1000,
        height: 500
      },
      image: null,
      currentPredictionId: 0,
      dialog: false,
      activeImage: 0
    }
  },
  computed: {
    ...mapState('assessments', [
      'assessments',
      'categories'
    ]),
    assessmentStatusDescription () {
      if (this.status === false) {
        return 'The assessment is still being processed. Please come back later.'
      }

      return 'There might be emerging issues. See below.'
    },
    assessmentStatusTitle () {
      if (this.status) {
        return 'Assessment ready'
      }
      return 'Pending for response'
    }
  },
  async created () {
    const self = this
    this.predictionScores = []
    this.predictions = []

    let fetchData = await this.fetchAssessmentsById(self.assessmentId)

    if (fetchData.success) {
      const assessment = fetchData.data.data

      this.status = assessment.attributes.is_ready_for_user
      this.personalizedPrompt = assessment.attributes.personalized_prompt

      if (
        assessment.relationships &&
        assessment.relationships.predictions &&
        assessment.relationships.predictions.data &&
        assessment.relationships.predictions.data.length > 0
      ) {
        const predictions = assessment.relationships.predictions.data

        for (var i = 0; i < predictions.length; i += 1) {
          const predictionId = predictions[i].id

          if (predictionId) {
            let res = await this.getPredictionById(predictionId)
            const predictionScores = res.included
            const newPredictionScores = Object.assign({}, this.predictionScores)

            let predictions = []
            let result = null
            let item = null

            for (let index = 0; index < predictionScores.length; index++) {
              const score = {}

              item = predictionScores[index]
              result = await this.getImageById(res.data.relationships.input.data.id)
              if (result.success) {
                score.predictionImage = result.data.data.attributes.host +
                                                result.data.data.attributes.lake + '/' +
                                                result.data.data.attributes.path
              } else {
                score.predictionImage = emptyImage
              }

              score.categoryId = parseInt(item.relationships.category.data.id)
              score.key = item.id
              score.polygon = item.attributes.polygon
              score.score = item.attributes.score
              score.width = item.attributes.image_width
              score.height = item.attributes.image_height
              score.color = this.getRandomColor()
              score.opacity = Math.random()
              score.active = false
              score.predictionId = predictionId

              predictions.push(score)
            }

            newPredictionScores[predictionId] = predictions

            this.predictionScores = Object.assign({}, newPredictionScores)
            this.predictions.push({
              id: predictionId,
              img: predictions[0].predictionImage,
              active: false
            })
          }
        }
      }
    }
  },
  mounted () {
    this.image = this.getImageInstanceFromSrc('https://wallpaperplay.com/walls/full/4/2/4/237428.jpg')
  },
  methods: {
    ...mapActions('assessments', [
      'getPredictionById',
      'getAssessmentsById',
      'getImageById',
      'deleteAssessmentById',
      'fetchAssessmentsById'
    ]),
    getImageInstanceFromSrc (src) {
      let image = new window.Image()

      image.src = src
      image.onload = () => {
        this.image = image
      }
    },
    getOverlayPolygon (prediction) {
      const positions = prediction.polygon.split(';')
      const leftTopPoint = positions[0].split(',')
      const rightBottomPoint = positions[3].split(',')

      // settings for overlay polygons
      return {
        x: parseFloat(leftTopPoint[0]),
        y: parseFloat(leftTopPoint[1]),
        width: Math.abs(parseFloat(leftTopPoint[0]) - parseFloat(rightBottomPoint[0])) * 10,
        height: Math.abs(parseFloat(leftTopPoint[1]) - parseFloat(rightBottomPoint[1])) + 90,
        fill: prediction.color,
        opacity: prediction.opacity
      }
    },
    generateRandom () {
      return Math.random().toString().substring(2, 10)
    },
    getRandomColor () {
      const letters = '0123456789ABCDEF'
      let color = '#'

      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
      }
      return color
    },
    showPredictions () {
      if (this.switch1) {
        return this.overlays
      }

      return []
    },
    showPredictionScores () {
      const self = this
      let predictions = Object.assign([], this.predictions)
      let idx = _.findIndex(predictions, function (o) {
        return o.id == self.currentPredictionId
      })

      if (idx > -1) {
        if (this.currentPredictionId !== 0 && predictions[idx].active) {
          return this.predictionScores[this.currentPredictionId]
        }
      }

      return []
    },
    setCurrentPredictionId (id) {
      this.currentPredictionId = id
      let predictions = Object.assign([], this.predictions)
      let newPredictions = []
      let predictionId = 0

      predictions.forEach(function (prediction, idx) {
        let newPrediction = Object.assign({}, prediction)
        newPrediction.active = false

        if (prediction.id == id) {
          predictionId = idx
          newPrediction.active = prediction.active
        }

        newPredictions.push(newPrediction)
      })

      newPredictions[predictionId].active = !newPredictions[predictionId].active
      this.predictions = newPredictions
    },
    activePrediction (predictionId) {
      let predictions = Object.assign([], this.predictionScores[this.currentPredictionId])
      let overlays = Object.assign([], this.overlays)

      let idx = _.findIndex(this.predictionScores[this.currentPredictionId], function (o) {
        return o.key == predictionId
      })

      if (idx > -1) {
        if (predictions[idx].active) {
          let overlayIdx = _.findIndex(overlays, function (o) {
            return o.key == predictionId
          })

          if (overlayIdx > -1) {
            overlays.splice(overlayIdx, 1)
            this.overlays = overlays
          }
        } else {
          this.overlays.push(this.predictionScores[this.currentPredictionId][idx])
        }

        predictions[idx].active = !predictions[idx].active
        this.predictionScores[this.currentPredictionId] = predictions
      }
    },
    getNameOfCategoryById (categoryId) {
      let idx = _.findIndex(this.categories, function (o) {
        return o.id == categoryId
      })

      if (idx > -1) {
        return this.categories[idx].attributes.name
      }

      return 'untitled'
    },
    deleteAssessment () {
      if (this.assessmentId) {
        this.deleteAssessmentById(this.assessmentId)
          .then(res => {
            if (res.success) {
              this.$router.push('assessments')
              this.showModal()
            } else {
              alert('Delete error!')
            }
          })
      }
    },
    showModal () {
      this.dialog = !this.dialog
    },
    onChangeCarouseImage (imageIndex) {
      this.activeImage = imageIndex
    }
  }
}
</script>

<style scoped>
.assessment-review {
  padding: 5px;
}

.assessment-review__footer {
  display: flex;
  justify-content: space-between;
}

.assessment-review-item {
  position: relative;
  width: 100px;
  align-self: center;
}

.assessment-review-item:last-child {
  width: auto;
}

.footer-preview-image.active {
  border: 3px solid orange;
}

.delete-assessment-btn {
  text-align: center;
}

.question-conten {
  margin-top: 20%;
}

@media (max-width: 575px) {
  .assessment-review-item {
    width: 70px;
  }

  .delete-assessment-btn {
    position: relative;
    display: block;
    width: 100%;
    text-align: center;
  }
}
</style>