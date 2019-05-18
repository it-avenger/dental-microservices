<template>
    <div class="sc-suggestions-row" v-if="!multiple" :style="{background: colors.messageList.bg}">
        <button class="sc-suggestions-element" v-for="(suggestion, idx) in suggestionData" @click="clicked(suggestion)"
        :style="baseStyles" :key="idx">{{suggestion.name}}&nbsp;</button>
    </div>
    <div class="sc-suggestions-row" v-else :style="{background: colors.messageList.bg}">
      <v-layout row wrap>
        <v-flex xs12 sm4 md4 v-for="(suggestion, idx) in suggestionData"  :key="idx">
          <button type="button" class="sc-suggestions-element" @click="clicked(suggestion)"
        :style="suggestion.selected ? selectedStyles : baseStyles" :key="idx" >{{suggestion.name}}&nbsp;</button>
        </v-flex>
        <v-flex xs12>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" style="border-radius: 15px;" type="button" :disabled="!selectedArr.length" @click="submitSuggestion()">Ok</v-btn>
        </v-card-actions>
      </v-flex>
      </v-layout>
    </div>
</template>

<script>
export default {
  data () {
    return {
      suggestionData: [],
      multiple: false,
      baseStyles: {},
      selectedStyles: {},
      selectedArr: []
    }
  },
  props: {
    suggestions: {
      type: Object
    },
    colors: {
      type: Object,
      required: true
    }
  },
  watch: {
    suggestions: function () {
      console.log(this.suggestions, '+++')
      let suggestions = this.suggestions

      this.multiple = false
      if (suggestions && suggestions.data) {
        this.suggestionData = suggestions.data.filter(s => {
          return s.parent === '0'
        }).map(function (obj) {
          let o = Object.assign({}, obj)
          o.selected = false
          return o
        })
        if (this.suggestions.multiple) {
          this.multiple = true
        }

        this.baseStyles = { borderColor: '#6CB4D9', backgroundColor: '#fff', color: '#6CB4D9' }
        this.selectedStyles = { borderColor: '#6CB4D9', backgroundColor: '#6CB4D9', color: '#fff' }
      }
    }
  },
  methods: {
    clicked (suggestion) {
      if (this.multiple) {
        suggestion.selected = !suggestion.selected
        let cur = this.selectedArr.indexOf(suggestion.id)
        if (cur > -1) {
          this.selectedArr.splice(cur, 1)
        } else {
          this.selectedArr.push(suggestion.id)
        }
      } else {
        if (!this.filterData(suggestion.id)) {
          let data = { author: 'me', type: 'text', data: { text: suggestion.name, topic: this.suggestions.topic, id: suggestion.id } }
          this.$parent._submitSuggestion(data)
        }
      }
      // this.$emit('sendSuggestion', suggestion)
    },
    filterData (id) {
      let suggestions = this.suggestions
      if (suggestions && suggestions.data) {
        this.suggestionData = suggestions.data.filter(s => {
          return s.parent === id
        })
        return this.suggestionData.length ? 1 : 0
      }
      return 0
    },
    submitSuggestion () {
      let text = ''
      this.selectedArr.forEach((el, index) => {
        let data = this.suggestions.data.find(function (element) {
          return element.id === el
        })
        if (index) {
          text += ', '
        }
        text += data.name
      })
      this.suggestionData = []
      this.$parent._submitSuggestion({ author: 'me', type: 'text', data: { text: text, topic: this.suggestions.topic, id: this.selectedArr } })
    }
  }
}
</script>

<style>
.sc-suggestions-row {
  text-align: center;
  background: inherit;
}

.sc-suggestions-element {
  margin: 3px;
  padding: 5px 10px 5px 10px;
  border: 1px solid;
  border-radius: 15px;
  font-size: 14px;
  background: inherit;
  cursor: pointer;
  border-radius: 4.8px;
  color: #fff;
}
</style>
