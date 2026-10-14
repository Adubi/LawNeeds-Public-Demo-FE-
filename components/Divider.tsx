import React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import {useTranslation} from 'react-i18next';

const Divider = () => {

  const {t} = useTranslation();

  return (
    <View style={styles.dividercontainer}>
      <View style={styles.line} />
      <Text style={styles.text}>{t('landing.or')}</Text>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  dividercontainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    marginHorizontal: wp(4),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#A9A9A9",
  },
  text: {
    marginHorizontal: 10,
    color: "#A9A9A9",
    fontSize: 16,
  },
});

export default Divider;
