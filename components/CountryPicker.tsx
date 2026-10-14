import React, {useState} from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {COUNTRIES} from "@/constants/countries";
import {COLORS} from "@/constants/colors";
import {SPACING, BORDER_RADIUS} from "@/constants/theme";
import {RFValue} from "react-native-responsive-fontsize";
import {useTranslation} from "react-i18next";
import {Ionicons} from "@expo/vector-icons";

interface CountryPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectCountry: (country: string) => void;
}

const CountryPicker: React.FC<CountryPickerProps> = ({
                                                       isVisible,
                                                       onClose,
                                                       onSelectCountry,
                                                     }) => {
  const {t} = useTranslation();
  const [search, setSearch] = useState("");

  const filteredCountries = COUNTRIES.filter((country) =>
      country.toLowerCase().includes(search.toLowerCase())
  );

  const handleCountryPress = (country: string) => {
    onSelectCountry(country);
    onClose();
  };

  return (
      <Modal
          visible={isVisible}
          transparent
          animationType="fade"
          onRequestClose={onClose}
      >
        <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              onClose();
            }}
        >
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.container}>

                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>
                    {t("select_a_country")}
                  </Text>

                  <TouchableOpacity onPress={onClose}>
                    <Ionicons
                        name="close"
                        size={22}
                        color={COLORS.PrimaryColor}
                    />
                  </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchWrapper}>
                  <Ionicons
                      name="search"
                      size={18}
                      color={COLORS.Gray}
                  />

                  <TextInput
                      style={styles.textInput}
                      placeholder={t("search_country")}
                      placeholderTextColor={COLORS.Gray}
                      value={search}
                      onChangeText={setSearch}
                  />

                  {search.length > 0 && (
                      <TouchableOpacity onPress={() => setSearch("")}>
                        <Ionicons
                            name="close-circle"
                            size={18}
                            color={COLORS.Gray}
                        />
                      </TouchableOpacity>
                  )}
                </View>

                {/* Countries */}
                <FlatList
                    showsVerticalScrollIndicator={false}
                    data={filteredCountries}
                    keyExtractor={(item) => item}
                    renderItem={({item}) => (
                        <TouchableOpacity
                            style={styles.itemContainer}
                            activeOpacity={0.7}
                            onPress={() => handleCountryPress(item)}
                        >
                          <Text style={styles.itemText}>
                            {item}
                          </Text>

                          <Ionicons
                              name="chevron-forward"
                              size={18}
                              color={COLORS.Gray}
                          />
                        </TouchableOpacity>
                    )}
                />

              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(16,24,40,0.55)",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
  },

  container: {
    backgroundColor: COLORS.BackgroundColor,
    borderRadius: 24,
    padding: SPACING.lg,
    height: "65%",
    maxHeight: "65%",
    elevation: 12,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },

  headerTitle: {
    fontFamily: "InstrumentSansSemiBold",
    fontSize: RFValue(17),
    color: COLORS.PrimaryColor,
  },

  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor:
        COLORS.BackgroundColor ||
        "#F6F8FB",

    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.Gray || "#E6EAF0",

    paddingHorizontal: 14,
    height: 50,

    marginBottom: SPACING.md,
  },

  textInput: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.PrimaryColorText,
    fontFamily: "InstrumentSansRegular",
    fontSize: RFValue(14),
  },

  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingVertical: 16,
    paddingHorizontal: 10,

    borderBottomWidth: 1,
    borderBottomColor:
        COLORS.Gray || "#EEF1F5",
  },

  itemText: {
    color: COLORS.PrimaryColorText,
    fontSize: RFValue(14),
    fontFamily: "InstrumentSansMedium",
  },
});

export default CountryPicker;