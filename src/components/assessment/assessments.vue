<template>
  <v-container
    class="fluid px-0"
  >
  <v-layout column>
    <v-flex xs12>
      <v-flex xs10 offset-xs1>
        <v-layout row wrap>
          <v-flex xs12>
            <v-layout row>
              <v-flex xs10>
                <div class="display-2"> Assessments </div>
              </v-flex>
              <v-flex xs2>
                <v-btn class="right" type="button" color="success" @click.stop="initialize()">New Assessment</v-btn>
              </v-flex>
            </v-layout>
          </v-flex>
        </v-layout>
      </v-flex>
    </v-flex>
  </v-layout>
  <v-layout row wrap my-3>
      <v-flex xs10 offset-xs1 v-if="msgData.data.length">
        <v-card>
          <v-container
            fluid
            grid-list-lg
          >
            <template v-for="(card, idx) in msgData.data">
              <v-layout row wrap v-bind:key="idx">
                <v-flex xs12>
                  <v-card elevation-3>
                    <v-container fluid grid-list-lg>
                      <v-layout row>
                        <v-flex
                          xs2
                          @click.stop="toRoute('view', {id: card.id})"
                          style="cursor: pointer"
                        >
                          <v-img
                            src="/static/img/user_64.png"
                            height="100px"
                            width="100px"
                            style="border-radius: 50%;"
                            contain
                          ></v-img>
                        </v-flex>
                        <v-flex xs10>
                          <div
                            class="title"
                            @click.stop="toRoute('view', {id: card.id})"
                            style="cursor: pointer"
                          >
                            {{dateForrmat(card.attributes.created_time)}} <br>
                            <span class="caption grey--text"> {{card.attributes.target_individual.replace('_', ' ')}} </span>
                          </div>
                        </v-flex>
                      </v-layout>
                    </v-container>
                  </v-card>
                </v-flex>
              </v-layout>
            </template>
          </v-container>
        </v-card>
        <v-card>
        <v-card-text v-if="msgData.data.length">
          <v-pagination
            v-model="msgData.page"
            :length="msgData.pages"
            @input="onPageChange"
          ></v-pagination>
        </v-card-text>
      </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>
<script>
import { mapActions } from 'vuex';
import Assessment from '@/services/assessment'
export default {
  name: 'Home',
  created () {
  },
  mounted () {
    this.getAssessments()
    this.fetchSuggestions()
  },
  data: () => ({
    assessment: new Assessment(),
    show: false,
    msgData: {
      data: [],
      page: 1,
      pages: 0
    },
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  }),
  methods: {
    ...mapActions('assessments', [
      'fetchSuggestions'
    ]),
    toRoute (rname, rparams = {}, query = {}) {
      this.$router.push({ name: rname, params: rparams, query: query })
    },
    initialize () {
      let formData = { query_term: '' }
      this.assessment.initialize(formData).then(res => {
        if (res.data && res.data.type === 'message-threads') {
          this.$router.push({ name: 'support', params: { id: res.data.id } })
        }
      })
    },
    getAssessments () {
      this.assessment.get(this.msgData.page).then(res => {
        if (res.data != null && res.meta) {
          this.msgData.data = res.data
          this.msgData.page = res.meta.pagination.page
          this.msgData.pages = res.meta.pagination.pages
        }
      })
    },
    onPageChange () {
      this.getAssessments()
    },
    dateForrmat (date) {
      let newDate = new Date(date)
      return this.months[newDate.getMonth()] + ' ' + newDate.getDay()
    }
  }
}
</script>
